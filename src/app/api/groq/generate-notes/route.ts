export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  throw new Error('Groq API key not configured');
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
    const { theme, coreTopics, targetAudience, primaryIntent, userId } = await req.json();

    if (!theme) {
      return NextResponse.json({ error: 'Theme is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
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

    const prompt = `Act as a top Substack growth strategist with 10+ years experience creating viral content. Generate 4 high-impact notes using this framework:

**Newsletter Context**
- Theme: ${theme}
${coreTopics ? `- Core Topics: ${coreTopics}` : ''}
${targetAudience ? `- Target Audience: ${targetAudience}` : ''}
- Primary Intent: ${primaryIntent}

**Creation Guidelines**
1. Hook Formula: Open with "Did you know?" / "Here's why X matters" / Controversial truth / Surprisaing statistic
2. Value Structure: Problem > Agitate > Solution > Proof
3. Viral Elements: 
   - Leverage psychological triggers (curiosity gap, FOMO, social proof)
   - Include actionable takeaways
   - Use audience-specific lingo/jargon
4. Platform Optimization:
   - 280-300 character sweet spot
   - 3-4 paragraph max with single-line breaks
   - Strategic emoji placement (max 1 per note)
5. CTAs: Soft sell with "Save this" / "Thoughts?" / "Tag someone who..."

**Output Requirements**
- Format as numbered list
- No markdown
- Vary hooks/angles across notes
- Tailor to note intent (${primaryIntent})
- Include 1 unexpected twist per note

After these output 2 long-form notes, that include up to 300 words and expant on the ${theme} , taking into account ${primaryIntent} .

Separate each note with a the following separator: ---###$$$###---
Output ONLY the notes and the separator, no other text. Do not number the notes.
Never mark the copywriting frameworks you used in the notes. Don't indicate the method used along with each note.
Don't restrict yourself to only a few wellknown copywriting frameworks like AIDA, FOMO, PAS, etc. Output each sentence on a new line.`;

    const response = await fetch('https://api.groq.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [
          {
            role: 'system',
            content: 'You are an expert social media content creator and viral growth strategist. You excel at creating engaging, viral social media posts.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 1,
        stop: null
      }),
      // Add timeout of 55 seconds
      signal: AbortSignal.timeout(55000)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate notes');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    const notes = content.split('---###$$$###---').map((note: string) => note.trim()).filter(Boolean);

    if (!notes.length) {
      throw new Error('No notes generated');
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

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Error generating notes:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate notes' },
      { status: 500 }
    );
  }
} 