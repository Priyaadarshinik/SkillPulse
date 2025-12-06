import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { githubAccessToken } = await req.json();
    
    if (!githubAccessToken) {
      throw new Error('GitHub access token is required');
    }

    console.log('Fetching repositories from GitHub...');

    // Fetch repositories from GitHub API
    const githubResponse = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
      headers: {
        'Authorization': `Bearer ${githubAccessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'SkillPulse-App',
      },
    });

    if (!githubResponse.ok) {
      const errorText = await githubResponse.text();
      console.error('GitHub API error:', githubResponse.status, errorText);
      throw new Error(`GitHub API error: ${githubResponse.status}`);
    }

    const repos = await githubResponse.json();
    console.log(`Fetched ${repos.length} repositories`);

    // Fetch user info from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${githubAccessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'SkillPulse-App',
      },
    });

    const githubUser = await userResponse.json();
    console.log('GitHub user:', githubUser.login);

    // Update user profile with GitHub info
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        github_username: githubUser.login,
        github_avatar_url: githubUser.avatar_url,
        github_connected_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      throw profileError;
    }

    // For each repo, fetch languages
    const reposWithLanguages = await Promise.all(
      repos.map(async (repo: any) => {
        try {
          const langResponse = await fetch(repo.languages_url, {
            headers: {
              'Authorization': `Bearer ${githubAccessToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'SkillPulse-App',
            },
          });
          
          const languages = langResponse.ok ? await langResponse.json() : {};
          
          return {
            user_id: user.id,
            github_id: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description || '',
            language: repo.language || 'Unknown',
            languages: languages,
            topics: repo.topics || [],
            stars: repo.stargazers_count || 0,
            forks: repo.forks_count || 0,
            default_branch: repo.default_branch || 'main',
            last_synced_at: new Date().toISOString(),
          };
        } catch (error) {
          console.error(`Error fetching languages for ${repo.name}:`, error);
          return {
            user_id: user.id,
            github_id: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description || '',
            language: repo.language || 'Unknown',
            languages: {},
            topics: repo.topics || [],
            stars: repo.stargazers_count || 0,
            forks: repo.forks_count || 0,
            default_branch: repo.default_branch || 'main',
            last_synced_at: new Date().toISOString(),
          };
        }
      })
    );

    console.log('Upserting repositories to database...');

    // Upsert repositories
    const { error: reposError } = await supabase
      .from('repositories')
      .upsert(reposWithLanguages, {
        onConflict: 'user_id,github_id',
        ignoreDuplicates: false,
      });

    if (reposError) {
      console.error('Error upserting repositories:', reposError);
      throw reposError;
    }

    console.log('Successfully synced repositories');

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: repos.length,
        message: `Successfully synced ${repos.length} repositories` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in sync-github-repos:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
