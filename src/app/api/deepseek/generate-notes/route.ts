export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { theme, coreTopics, targetAudience, primaryIntent } = await req.json();

    if (!theme || !primaryIntent) {
      return NextResponse.json(
        { error: 'Theme and Primary Intent are required' },
        { status: 400 }
      );
    }

    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    if (!DEEPSEEK_API_KEY) {
      throw new Error('Deepseek API key not configured');
    }

    const prompt = `Act as a top Substack growth strategist with 10+ years experience creating viral content. Generate 4 high-impact notes using this framework:

**Newsletter Context**
- Theme: ${theme}
${coreTopics ? `- Core Topics: ${coreTopics}` : ''}
${targetAudience ? `- Target Audience: ${targetAudience}` : ''}
- Primary Intent: ${primaryIntent}

**Creation Guidelines**
1. Hook Formula: Open with "Did you know?" / "Here's why X matters" / Controversial truth / Surprising statistic
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

Separate each note with a the following separator: ---###$$$###---
Output ONLY the notes and the separator, no other text. Do not number the notes.
Never mark the copywriting frameworks you used in the notes. Don't indicate the method used along with each note.
Don't restrict yourself to only a few wellknown copywriting frameworks like AIDA, FOMO, PAS, etc. Output each sentence on a new line.
`;

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
            content: 'You are an expert social media content creator and viral growth strategist. You excel at creating engaging, viral social media posts.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
        top_p: 1.0
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

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Error generating notes:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate notes' },
      { status: 500 }
    );
  }
} 