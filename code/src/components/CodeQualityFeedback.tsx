import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { CheckCircle2, AlertTriangle, Info, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";

interface Feedback {
  category: string;
  severity: "info" | "warning" | "success";
  message: string;
}

export const CodeQualityFeedback = () => {
  const [feedback, setFeedback] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const analyzeFeedback = (text: string): Feedback[] => {
    const lines = text.split("\n").filter(line => line.trim());
    const feedbacks: Feedback[] = [];
    
    lines.forEach(line => {
      let severity: "info" | "warning" | "success" = "info";
      let category = "General";
      
      if (line.includes("✅") || line.includes("Good") || line.includes("Well")) {
        severity = "success";
      } else if (line.includes("⚠️") || line.includes("Consider") || line.includes("Should")) {
        severity = "warning";
      }
      
      if (line.includes("Structure") || line.includes("Architecture")) {
        category = "Structure";
      } else if (line.includes("Pattern") || line.includes("Design")) {
        category = "Patterns";
      } else if (line.includes("Practice") || line.includes("Standard")) {
        category = "Best Practices";
      } else if (line.includes("Security")) {
        category = "Security";
      } else if (line.includes("Performance")) {
        category = "Performance";
      }
      
      if (line.trim()) {
        feedbacks.push({ category, severity, message: line.replace(/[✅⚠️]/g, "").trim() });
      }
    });
    
    return feedbacks;
  };

  const fetchFeedback = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please sign in first");
        return;
      }

      const { data, error } = await supabase.functions.invoke('ask-code', {
        body: { 
          query: `Analyze my repositories and provide detailed feedback on code quality. Focus on:
          
1. **Code Structure & Architecture**: Evaluate project organization, file structure, and architectural patterns
2. **Design Patterns**: Identify patterns used and suggest improvements
3. **Best Practices**: Review adherence to language/framework best practices
4. **Code Quality**: Comment on readability, maintainability, and documentation
5. **Security**: Highlight potential security concerns
6. **Performance**: Suggest performance optimization opportunities

Format your response with clear categories and mark positive aspects with ✅ and areas for improvement with ⚠️.`
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

      setFeedback(data.answer);
    } catch (error: any) {
      console.error("Error fetching feedback:", error);
      toast.error("Failed to analyze code quality");
    } finally {
      setIsLoading(false);
    }
  };

  const feedbackItems = feedback ? analyzeFeedback(feedback) : [];

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "success":
        return "bg-green-500/10 border-green-500/20 text-green-500";
      case "warning":
        return "bg-yellow-500/10 border-yellow-500/20 text-yellow-500";
      default:
        return "bg-blue-500/10 border-blue-500/20 text-blue-500";
    }
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold">Code Quality Analysis</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchFeedback}
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
      ) : feedbackItems.length > 0 ? (
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {feedbackItems.map((item, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getSeverityColor(item.severity)}`}
              >
                <div className="flex items-start gap-2">
                  {getSeverityIcon(item.severity)}
                  <div className="flex-1">
                    <Badge variant="outline" className="mb-1 text-xs">
                      {item.category}
                    </Badge>
                    <p className="text-sm leading-relaxed">{item.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <p className="text-muted-foreground text-sm">
          Click refresh to analyze your code quality and get improvement suggestions
        </p>
      )}
    </Card>
  );
};
