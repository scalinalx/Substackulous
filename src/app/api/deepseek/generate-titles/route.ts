import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/clients';
import Together from 'together-ai';

// Initialize Supabase admin client.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(req: Request) {
  try {
    // Parse request body.
    const { theme, userId } = await req.json();
    if (!theme || !userId) {
      return NextResponse.json(
        { error: 'Theme and userId are required' },
        { status: 400 }
      );
    }

    // Check Authorization header.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('No Authorization header');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const { data: { user: sessionUser }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !sessionUser) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (sessionUser.id !== userId) {
      console.error('User ID mismatch:', { sessionUserId: sessionUser.id, requestUserId: userId });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch the user's profile (for informational purposes only).
    let { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();
    if (profileError || !profile) {
      console.error('Profile query error:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch user profile', details: profileError?.message },
        { status: 404 }
      );
    }
    // (Credit deduction is handled on the frontend.)

    // Build the prompt.
    // Note: The system prompt already provides the viral content expert instruction,
    // so we omit that line from the user prompt.
    const prompt = `Generate 10 viral titles for a post about "${theme}" using these proven frameworks as inspiration:
1. Numbers + Specific Value
2. Curiosity Gap
3. How-to
4. Ultimate Guide
5. Problem-Solution
6. Listicle
7. Question
8. Secret Reveal
9. Time-Based
10. Controversy
Follow these rules:
1. Make titles specific and actionable
2. Include numbers where relevant
3. Use power words strategically
4. Create curiosity without clickbait
5. Keep length under 80 characters when possible
6. Target the right emotional triggers
7. Make value proposition clear
8. Use current year where relevant
9. Use strategic clickbait whenever possible
Don't limit yourself to the frameworks. Use them only as inspiration.
Output ONLY the titles, one per line.
No explanations or frameworks needed.
DO NOT OUTPUT ANYTHING ELSE BUT THE TITLES.
Be aware that current year is 2025!`;

    // Initialize Together AI.
    const together = new Together();

    // Call Together AI's chat completions API with streaming enabled.
    const stream = await together.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "Act like a viral content expert with 10+ years experience in crafting high-performing headlines.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
      max_tokens: 16384,
      temperature: 1.42,
      top_p: 0.7,
      top_k: 50,
      repetition_penalty: 1,
      stop: ["<|eot_id|>", "<|eom_id|>"],
      stream: true,
    });

    // Accumulate tokens from the stream.
    let fullMessage = "";
    for await (const token of stream) {
      const content = token.choices[0]?.delta?.content;
      if (content) {
        fullMessage += content;
      }
    }

    // Process the output: split into individual titles.
    const titles = fullMessage
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "")
      .map((title) =>
        title
          .replace(/^\d+\.\s*/, "") // Remove leading numbers and dots.
          .replace(/^["']|["']$/g, "") // Remove quotes.
          .trim()
      )
      .filter((title) => title);

    if (!titles.length) {
      throw new Error("No titles generated");
    }

    return NextResponse.json({ titles });
  } catch (error) {
    console.error("Error generating titles:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate titles" },
      { status: 500 }
    );
  }
}
