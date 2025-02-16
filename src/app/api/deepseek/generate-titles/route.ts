import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateSession, validateCredits, deductCredits } from '@/lib/middleware/auth';
import Groq from 'groq-sdk';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  throw new Error('Groq API key not configured');
}

const groq = new Groq({
  apiKey: GROQ_API_KEY
});

export async function POST(req: Request) {
  try {
    const { theme, userId } = await req.json();

    if (!theme || !userId) {
      return NextResponse.json(
        { error: 'Theme and userId are required' },
        { status: 400 }
      );
    }

    // Validate session
    const sessionValidation = await validateSession(req);
    if ('error' in sessionValidation) {
      return NextResponse.json(
        { error: sessionValidation.error }, 
        { status: sessionValidation.status }
      );
    }

    if (sessionValidation.sessionUser.id !== userId) {
      console.error('User ID mismatch:', { 
        sessionUserId: sessionValidation.sessionUser.id, 
        requestUserId: userId 
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Validate credits
    const creditCost = 1;
    const { profile, error: creditError, status: creditStatus } = await validateCredits(userId, creditCost);
    if (creditError) {
      return NextResponse.json({ error: creditError }, { status: creditStatus });
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

    // Deduct credits
    const { error: deductError, status: deductStatus } = await deductCredits(userId, creditCost);
    if (deductError) {
      return NextResponse.json({ error: deductError }, { status: deductStatus });
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