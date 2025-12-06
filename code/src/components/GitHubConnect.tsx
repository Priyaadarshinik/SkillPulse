import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Github, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GitHubConnectProps {
  onConnected: () => void;
}

export const GitHubConnect = ({ onConnected }: GitHubConnectProps) => {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    if (!token.trim()) {
      toast.error("Please enter your GitHub token");
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please sign in first");
        return;
      }

      const { data, error } = await supabase.functions.invoke('sync-github-repos', {
        body: { githubAccessToken: token },
      });

      if (error) throw error;

      toast.success(data.message || "GitHub repositories synced successfully!");
      onConnected();
    } catch (error: any) {
      console.error('GitHub sync error:', error);
      toast.error(error.message || "Failed to sync GitHub repositories");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 bg-card border-border">
        <div className="flex flex-col items-center mb-8">
          <div className="p-4 bg-gradient-hero rounded-2xl shadow-glow-primary mb-4">
            <Github className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Connect Your GitHub</h2>
          <p className="text-muted-foreground text-center max-w-md">
            To analyze your code with AI, we need access to your GitHub repositories. 
            Create a personal access token with <code className="text-xs bg-secondary px-2 py-1 rounded">repo</code> scope.
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-secondary/50 border border-border rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-sm">How to get your token:</h3>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)</li>
              <li>Click "Generate new token (classic)"</li>
              <li>Select <code className="bg-background px-1 rounded">repo</code> scope</li>
              <li>Generate and copy the token</li>
            </ol>
          </div>

          <div className="space-y-2">
            <Label htmlFor="token">GitHub Personal Access Token</Label>
            <Input
              id="token"
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="bg-secondary border-border font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Your token is only used to fetch repository data and is never stored.
            </p>
          </div>

          <Button
            onClick={handleConnect}
            disabled={loading || !token.trim()}
            className="w-full bg-gradient-hero hover:opacity-90 transition-opacity shadow-glow-primary"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Syncing Repositories...
              </>
            ) : (
              <>
                <Github className="w-4 h-4 mr-2" />
                Connect GitHub
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};
