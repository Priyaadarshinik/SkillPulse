import { Card } from "./ui/card";
import { Sparkles, Code2 } from "lucide-react";

interface ResponseDisplayProps {
  response: string;
  isLoading: boolean;
}

export const ResponseDisplay = ({ response, isLoading }: ResponseDisplayProps) => {
  if (!response && !isLoading) {
    return (
      <Card className="p-8 bg-card border-border text-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Code2 className="w-12 h-12 opacity-50" />
          <p>Your AI-powered insights will appear here</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card border-border animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-accent" />
        <h3 className="text-lg font-semibold">AI Response</h3>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-4 bg-secondary rounded animate-pulse" />
          <div className="h-4 bg-secondary rounded animate-pulse w-5/6" />
          <div className="h-4 bg-secondary rounded animate-pulse w-4/6" />
        </div>
      ) : (
        <div className="prose prose-invert max-w-none">
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">
            {response}
          </p>
        </div>
      )}
    </Card>
  );
};
