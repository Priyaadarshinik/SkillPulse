import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { BookOpen, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const InterviewQuestions = () => {
  const [questions, setQuestions] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please sign in first");
        return;
      }

      const { data, error } = await supabase.functions.invoke('ask-code', {
        body: { 
          query: "Generate 8-10 technical interview questions based on the languages, frameworks, and technologies found in my repositories. Include questions about data structures, algorithms, system design, and technology-specific topics. Vary the difficulty levels from junior to senior."
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

      setQuestions(data.answer);
    } catch (error: any) {
      console.error("Error fetching questions:", error);
      toast.error("Failed to generate interview questions");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Interview Questions</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchQuestions}
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
      ) : questions ? (
        <div className="prose prose-sm prose-invert max-w-none">
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">
            {questions}
          </p>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          Click refresh to generate interview questions
        </p>
      )}
    </Card>
  );
};
