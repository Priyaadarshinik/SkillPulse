import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Lightbulb, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const ProjectIdeas = () => {
  const [ideas, setIdeas] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please sign in first");
        return;
      }

      const { data, error } = await supabase.functions.invoke('ask-code', {
        body: { 
          query: "Suggest 4-6 concrete project ideas based on my existing repositories and skill set. Each project should build upon my current technologies, challenge me to learn complementary skills, be practical and portfolio-worthy, and match my current experience level. Include brief descriptions of what each project would involve."
        },
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

      setIdeas(data.answer);
    } catch (error: any) {
      console.error("Error fetching ideas:", error);
      toast.error("Failed to generate project ideas");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold">Project Ideas</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchIdeas}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-4 bg-secondary rounded animate-pulse" />
          <div className="h-4 bg-secondary rounded animate-pulse w-5/6" />
          <div className="h-4 bg-secondary rounded animate-pulse w-4/6" />
        </div>
      ) : ideas ? (
        <div className="prose prose-sm prose-invert max-w-none">
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">
            {ideas}
          </p>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          Click refresh to generate project ideas
        </p>
      )}
    </Card>
  );
};
