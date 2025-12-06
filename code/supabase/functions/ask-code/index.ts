import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
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

    const { query } = await req.json();

    if (!query) {
      throw new Error('Query is required');
    }

    console.log('Fetching user repositories...');

    // Fetch user's repositories
    const { data: repos, error: reposError } = await supabase
      .from('repositories')
      .select('*')
      .eq('user_id', user.id);

    if (reposError) {
      console.error('Error fetching repositories:', reposError);
      throw reposError;
    }

    if (!repos || repos.length === 0) {
      return new Response(
        JSON.stringify({ 
          answer: "I couldn't find any repositories in your account. Please connect your GitHub account first to analyze your code." 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${repos.length} repositories`);

    // Prepare context about repositories
    const repoContext = repos.map((repo: any) => {
      const languages = Object.keys(repo.languages || {}).join(', ') || repo.language || 'Unknown';
      const topics = (repo.topics || []).join(', ') || 'none';
      return `- **${repo.name}**: ${repo.description || 'No description'}\n  Languages: ${languages}\n  Topics: ${topics}\n  Stars: ${repo.stars}`;
    }).join('\n\n');

    // Prepare language summary
    const allLanguages: Record<string, number> = {};
    repos.forEach((repo: any) => {
      if (repo.languages && typeof repo.languages === 'object') {
        Object.keys(repo.languages).forEach(lang => {
          allLanguages[lang] = (allLanguages[lang] || 0) + 1;
        });
      }
    });

    const topLanguages = Object.entries(allLanguages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([lang, count]) => `${lang} (${count} repos)`)
      .join(', ');

    const systemPrompt = `You are SkillPulse AI, an intelligent assistant that helps developers understand their GitHub projects, generate relevant interview questions, and suggest project ideas.

You have access to the user's repository information. Use this to provide personalized, actionable insights.

**User's Repository Overview:**
Total repositories: ${repos.length}
Top languages: ${topLanguages}

**Repositories:**
${repoContext}

**Your capabilities:**
1. **Interview Questions**: Generate technical interview questions based on the languages, frameworks, and technologies found in their repos. Cover topics like data structures, algorithms, system design, and technology-specific questions.

2. **Project Ideas**: Suggest new project ideas that:
   - Build upon their existing skill set and technologies
   - Challenge them to learn complementary technologies
   - Are practical and portfolio-worthy
   - Match their current experience level

3. **Code Analysis**: Analyze patterns across their projects and provide insights about their coding style, preferred technologies, and areas for growth.

When answering:
- Be specific and reference actual repository names when relevant
- For interview questions: Generate 5-10 questions with varying difficulty levels based on their tech stack
- For project ideas: Suggest 3-5 concrete project ideas with brief descriptions
- Highlight patterns you notice across their projects
- Provide actionable, personalized insights
- Be conversational but informative`;

    console.log('Calling Lovable AI...');

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI usage limit reached. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const answer = aiData.choices[0].message.content;

    console.log('Successfully generated AI response');

    return new Response(
      JSON.stringify({ answer }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in ask-code function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
