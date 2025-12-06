import { useState, useEffect } from "react";
import { Hero } from "@/components/Hero";
import { Dashboard } from "@/components/Dashboard";
import { AuthPage } from "@/components/AuthPage";
import { GitHubConnect } from "@/components/GitHubConnect";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [showHero, setShowHero] = useState(true);
  const [hasGithub, setHasGithub] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check GitHub connection after auth state changes
        if (session?.user) {
          setTimeout(() => {
            checkGitHubConnection(session.user.id);
          }, 0);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkGitHubConnection(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkGitHubConnection = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('github_connected_at')
        .eq('id', userId)
        .single();

      if (!error && data?.github_connected_at) {
        setHasGithub(true);
      }
    } catch (error) {
      console.error('Error checking GitHub connection:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Not authenticated - show hero or auth page
  if (!user) {
    if (showHero) {
      return <Hero onGetStarted={() => setShowHero(false)} />;
    }
    return <AuthPage onSuccess={() => setShowHero(true)} />;
  }

  // Authenticated but no GitHub connection
  if (!hasGithub) {
    return <GitHubConnect onConnected={() => setHasGithub(true)} />;
  }

  // Fully set up - show dashboard
  return <Dashboard />;
};

export default Index;
