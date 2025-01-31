export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
if (!DEEPSEEK_API_KEY) {
  throw new Error('Deepseek API key not configured');
}

// Initialize Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(req: Request) {
  try {
    const { 
      topic,
      keyPoints,
      targetAudience,
      objective,
      format,
      knowledgeLevel,
      tone,
      wordCount,
      userId
    } = await req.json();

    if (!topic || !userId) {
      return NextResponse.json(
        { error: 'Topic and userId are required' },
        { status: 400 }
      );
    }

    // Get the session from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('No Authorization header');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the token and get the user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data: { user: sessionUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !sessionUser) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (sessionUser.id !== userId) {
      console.error('User ID mismatch:', { sessionUserId: sessionUser.id, requestUserId: userId });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // First, check if user has enough credits
    let { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Profile query error:', profileError);
      return NextResponse.json({ 
        error: 'Failed to fetch user profile',
        details: profileError.message 
      }, { status: 404 });
    }

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const creditCost = 2;
    if (profile.credits < creditCost) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 });
    }

    const prompt = `Act as a master content architect and Pulitzer-winning editorial director. The best in the world at writing viral, engaging Substack posts.
Create a ${format} outline using:

**Strategic Foundation**
- Primary Goal: ${objective}
- Audience Profile: ${knowledgeLevel} | Target Audience: ${targetAudience || 'General audience'}
${keyPoints ? `- Key Points to Address:\n${keyPoints}` : ''}

**Content Core**
- Central Theme: "${topic}"
- Target Length: ${wordCount} words
- Content Style: ${tone.join(', ')}

**Output Requirements**
1. Title Options (3 viral headline variants)
2. Meta Description (160 chars)
3. Detailed Section Framework
   - Introduction (Hook + Context)
   - Main Body (3-5 key sections)
   - Conclusion + Call to Action
4. Key Data Points to Include
5. Engagement Hooks (Open Loops/Story Elements)
6. SEO Optimization Notes

Format the outline with clear hierarchical structure using markdown.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are an expert content strategist and outline creator. You excel at creating well-structured, engaging outlines for viral blog posts.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1200,
          top_p: 1.0
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = 'Failed to generate outline';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
        } catch (parseError) {
          // If we can't parse the error response as JSON, try to get the text
          try {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          } catch {
            // If we can't get the text either, use the default error message
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const outline = data.choices[0]?.message?.content;

      if (!outline) {
        throw new Error('No outline generated');
      }

      // Update the credits using supabaseAdmin
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ credits: profile.credits - creditCost })
        .eq('id', userId);

      if (updateError) {
        console.error('Failed to update credits:', updateError);
        return NextResponse.json({ 
          error: 'Failed to update credits' 
        }, { status: 500 });
      }

      return NextResponse.json({ outline });
    } catch (error) {
      console.error('Error generating outline:', error);
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error generating outline:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
} 