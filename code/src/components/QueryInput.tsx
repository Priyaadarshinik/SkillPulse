import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { Send } from "lucide-react";

interface QueryInputProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
}

export const QueryInput = ({ onSubmit, isLoading }: QueryInputProps) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSubmit(query);
      setQuery("");
    }
  };

  const exampleQueries = [
    "How did I implement user authentication last time?",
    "Show me all projects where I used TensorFlow",
    "What patterns do I use most frequently?",
  ];

  return (
    <Card className="p-6 bg-card border-border animate-fade-in">
      <h2 className="text-xl font-semibold mb-4">Ask About Your Code</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type your question here... (e.g., 'How did I handle API authentication in my last project?')"
          className="min-h-[120px] resize-none bg-secondary border-border focus:border-primary transition-colors"
          disabled={isLoading}
        />
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {query.length}/500
          </div>
          <Button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="bg-gradient-hero hover:opacity-90 transition-opacity shadow-glow-primary"
          >
            {isLoading ? (
              <>
                <span className="animate-pulse">Analyzing...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Ask
              </>
            )}
          </Button>
        </div>
      </form>

      <div className="mt-6 space-y-2">
        <p className="text-sm text-muted-foreground">Try these examples:</p>
        <div className="flex flex-wrap gap-2">
          {exampleQueries.map((example, index) => (
            <button
              key={index}
              onClick={() => setQuery(example)}
              className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 
                       border border-border hover:border-primary/50 transition-colors"
              disabled={isLoading}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
};
