import { useState, useEffect } from "react";
import { QueryInput } from "./QueryInput";
import { ResponseDisplay } from "./ResponseDisplay";
import { SkillGraph } from "./SkillGraph";
import { InterviewQuestions } from "./InterviewQuestions";
import { ProjectIdeas } from "./ProjectIdeas";
import { MockInterview } from "./MockInterview";
import { CodeQualityFeedback } from "./CodeQualityFeedback";
import { Brain, LogOut, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Repository {
  id: string;
  name: string;
  language: string;
  languages: any; // Json type from Supabase
}

export const Dashboard = () => {
  const [response, setResponse] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadRepositories();
  }, []);

  const loadRepositories = async () => {
    try {
      const { data, error } = await supabase
        .from('repositories')
        .select('*')
        .order('last_synced_at', { ascending: false });

      if (error) throw error;
      setRepos(data as Repository[] || []);
    } catch (error: any) {
      console.error('Error loading repositories:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const handleQuery = async (query: string) => {
    setIsLoading(true);
    setResponse("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please sign in first");
        return;
      }

      const { data, error } = await supabase.functions.invoke('ask-code', {
        body: { query },
      });

      if (error) {
        if (error.message?.includes('429')) {
          toast.error("Rate limit exceeded. Please try again later.");
        } else if (error.message?.includes('402')) {
          toast.error("AI usage limit reached. Please add credits.");
        } else {
          throw error;
        }
        return;
      }

      setResponse(data.answer);
    } catch (error: any) {
      console.error("Error querying:", error);
      toast.error(error.message || "Failed to process your query");
      setResponse("Sorry, there was an error processing your query. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-hero rounded-lg shadow-glow-primary">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                SkillPulse
              </h1>
              <p className="text-muted-foreground text-sm">
                {repos.length} repositories analyzed
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadRepositories}
              disabled={isSyncing}
              className="border-border"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="border-border"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Main content grid */}
        <div className="space-y-6">
          {/* Skills Overview */}
          <div>
            <SkillGraph repositories={repos} />
          </div>

          {/* Interview Questions and Project Ideas */}
          <div className="grid lg:grid-cols-2 gap-6">
            <InterviewQuestions />
            <ProjectIdeas />
          </div>

          {/* Mock Interview and Code Quality */}
          <div className="grid lg:grid-cols-2 gap-6">
            <MockInterview />
            <CodeQualityFeedback />
          </div>

          {/* AI Query Section */}
          <div className="space-y-6">
            <QueryInput onSubmit={handleQuery} isLoading={isLoading} />
            <ResponseDisplay response={response} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
};
