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
            content: 'You are an expert copywriter and viral content strategist. You excel at creating engaging, viral titles that drive clicks and engagement.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 1.0
      }),
      // Add timeout of 55 seconds
      signal: AbortSignal.timeout(55000)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate titles');
    }

    const data = await response.json();
    const titles = data.choices[0]?.message?.content
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