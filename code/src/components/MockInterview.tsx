import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { MessageSquare, Send, PlayCircle, StopCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ScrollArea } from "./ui/scroll-area";

interface Message {
  role: "assistant" | "user";
  content: string;
}

export const MockInterview = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userInput, setUserInput] = useState("");

  const startInterview = async () => {
    setIsLoading(true);
    setIsActive(true);
    setMessages([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please sign in first");
        return;
      }

      const { data, error } = await supabase.functions.invoke('ask-code', {
        body: { 
          query: "Start a technical interview with me. Ask me one technical question based on my repositories. Make it conversational and wait for my answer before asking follow-up questions."
        },
      });

      if (error) throw error;

      setMessages([{ role: "assistant", content: data.answer }]);
    } catch (error: any) {
      console.error("Error starting interview:", error);
      toast.error("Failed to start interview");
      setIsActive(false);
    } finally {
      setIsLoading(false);
    }
  };

  const sendAnswer = async () => {
    if (!userInput.trim()) return;

    const newMessages = [...messages, { role: "user" as const, content: userInput }];
    setMessages(newMessages);
    setUserInput("");
    setIsLoading(true);

    try {
      const conversationContext = newMessages
        .map(m => `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.content}`)
        .join("\n\n");

      const { data, error } = await supabase.functions.invoke('ask-code', {
        body: { 
          query: `Continue this technical interview. Here's the conversation so far:\n\n${conversationContext}\n\nBased on the candidate's last answer, ask a relevant follow-up question or explore a related technical topic from their repositories. Keep it conversational and engaging.`
        },
      });

      if (error) throw error;

      setMessages([...newMessages, { role: "assistant", content: data.answer }]);
    } catch (error: any) {
      console.error("Error sending answer:", error);
      toast.error("Failed to continue interview");
    } finally {
      setIsLoading(false);
    }
  };

  const endInterview = () => {
    setIsActive(false);
    setMessages([]);
  };

  return (
    <Card className="p-6 bg-card border-border h-[500px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Mock Interview</h3>
        </div>
        {!isActive ? (
          <Button
            variant="default"
            size="sm"
            onClick={startInterview}
            disabled={isLoading}
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            Start Interview
          </Button>
        ) : (
          <Button
            variant="destructive"
            size="sm"
            onClick={endInterview}
          >
            <StopCircle className="w-4 h-4 mr-2" />
            End Interview
          </Button>
        )}
      </div>

      {!isActive && messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-sm text-center">
            Start a mock technical interview based on your repositories.<br />
            The AI will ask questions and follow-ups based on your answers.
          </p>
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    message.role === "assistant"
                      ? "bg-primary/10 border border-primary/20"
                      : "bg-secondary"
                  }`}
                >
                  <p className="text-xs font-semibold mb-1 text-muted-foreground">
                    {message.role === "assistant" ? "Interviewer" : "You"}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              ))}
              {isLoading && (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-xs font-semibold mb-1 text-muted-foreground">Interviewer</p>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-75" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {isActive && (
            <div className="mt-4 flex gap-2">
              <Input
                placeholder="Type your answer..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !isLoading && sendAnswer()}
                disabled={isLoading}
              />
              <Button
                size="icon"
                onClick={sendAnswer}
                disabled={isLoading || !userInput.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
};
