import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/clients';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
if (!DEEPSEEK_API_KEY) {
  throw new Error('Deepseek API key not configured');
}

import Groq from 'groq-sdk';
import { Completions } from 'groq-sdk/resources/completions.mjs';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  throw new Error('Groq API key not configured');
}

const groq = new Groq({
  apiKey: GROQ_API_KEY
});

// Initialize Supabase admin client with service role key for admin operations
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
    const { theme, userId } = await req.json();

    if (!theme || !userId) {
      return NextResponse.json(
        { error: 'Theme and userId are required' },
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
    
    // Verify the token and get the user using the imported supabase client
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

    const creditCost = 1;
    if (profile.credits < creditCost) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 });
    }

    const prompt = `Act as a viral content expert with 10+ years experience in crafting high-performing headlines. Generate 10 viral titles for a post about "${theme}" using these proven frameworks:

1. Numbers + Specific Value: "5 Proven Ways to [Benefit] That [Target] Can Start Today"
2. Curiosity Gap: "The Surprising Truth About [Topic] That [Target] Never Knew"
3. How-to: "How to [Achieve Goal] Without [Common Pain Point]"
4. Ultimate Guide: "The Ultimate Guide to [Topic] for [Target] in [Current Year]"
5. Problem-Solution: "Struggling with [Problem]? Here's How to [Solution]"
6. Listicle: "[X] Essential [Topic] Tips That Will [Benefit]"
7. Question: "Are You Making These [Topic] Mistakes?"
8. Secret Reveal: "The Hidden [Topic] Strategy That [Target] Uses"
9. Time-Based: "How I [Achievement] in [Timeframe] Using This [Topic] Method"
10. Controversy: "Why Everything You Know About [Topic] Is Wrong"

Follow these rules:
1. Make titles specific and actionable
2. Include numbers where relevant
3. Use power words strategically
4. Create curiosity without clickbait
5. Keep length under 60 characters when possible
6. Target the right emotional triggers
7. Make value proposition clear
8. Use current year where relevant
9. Use strategic clickbait whenever possible

Output ONLY the titles, one per line. No explanations or frameworks needed.`;


    const completion = await groq.chat.completions.create({
      messages: [{
        role: "user",
        content: prompt
      }],
      model: "deepseek-r1-distill-llama-70b",
      temperature: 0.99,
      max_tokens: 4096,
      top_p: 0.95,
      stream: false,
      stop: null
    });

    console.log('Received response from Groq API');

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from API');
    }

    const titles = content
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .split('\n')
      .filter((line: string) => line.trim())
      .map((title: string) => {
        // Remove numbers, quotes, and extra whitespace
        return title
          .replace(/^\d+\.\s*/, '') // Remove leading numbers and dots
          .replace(/^["']|["']$/g, '') // Remove quotes
          .trim(); // Remove extra whitespace
      })
      .filter((title: string) => title);

    if (!titles.length) {
      throw new Error('No titles generated');
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

    return NextResponse.json({ titles });
  } catch (error) {
    console.error('Error generating titles:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate titles' },
      { status: 500 }
    );
  }
} 