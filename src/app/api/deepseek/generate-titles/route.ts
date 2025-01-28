import { NextResponse } from 'next/server';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const API_URL = 'https://api.deepseek.com/v1/chat/completions';

export async function POST(req: Request) {
  try {
    const { theme, mainIdeas } = await req.json();

    if (!theme) {
      return NextResponse.json(
        { error: 'Theme is required' },
        { status: 400 }
      );
    }

    const prompt = `Act as an email marketing expert with 10+ years experience achieving 60%+ open rates for 1M+ subscriber newsletters. Generate 13 title options for a Substack post about ${theme}${mainIdeas ? ` focusing on ${mainIdeas}` : ''}. Use this proven framework:

**Core Principles**
1. Prioritize clarity over cleverness - never confuse readers
2. Balance value proposition with curiosity triggers
3. Alternate between 4 title types (see structural requirements)
4. Maintain 4:1 ratio of substantive vs. clickbait-style titles
5. Never sacrifice long-term trust for short-term clicks

**Structural Requirements**
_Method 1 (4 titles): Long-Form Value_
- Include numbers + specific benefit + timeframe/outcome
- Format: [Number] [What] That [Specific Audience] Needs to [Positive Outcome] and [Secondary Benefit]
Example: "5 Tax Strategies Every Freelancer Making $100K+ Needs to Save $15K/Year and Sleep Better"

_Method 2 (3 titles): Current Event Hooks_
- Leverage recent news/trends + analysis angle
- Include: Time context + "so you don't have to" value prop
Example: "Why [Current Event] Matters for [Audience]: 3 Key Takeaways From My 20-Hour Analysis"

_Method 3 (3 titles): Short & Substantive_
- Ultra-specific questions or bold statements
- Max 8 words, no fluff
Example: "Is This $200B Market About to Collapse?"

_Method 4 (3 titles): Strategic Clickbait_
- <8 words, high emotional punch
- Use curiosity gap + outcome hint
- Include ONE of these elements:
  - "Secret" / "Hidden" / "Nobody Tells You"
  - "This [Common Thing] Will [Shocking Verb] Your [Value]"
  - "Stop [Common Action] Immediately"
Example: "The Retirement Secret Wall Street Hates"

**Output Rules**
- Vary sentence structures across all titles
- Never use ALL CAPS or excessive punctuation
- Mark each title with (Method 1/2/3/4)
- Include 2 "evergreen" options that work year-round
- Add warning note for Method 4 titles: "Use max 1/week"

Output ONLY the titles, one per line, no other text. Don't include any other text or instructions. Don't indicate the method used along with each title. Don't number the titles.`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1.0
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate titles');
    }

    const data = await response.json();
    const titles = data.choices[0].message.content
      .split('\n')
      .filter((line: string) => line.trim())
      .map((title: string) => {
        // Remove numbers, quotes, and extra whitespace
        return title
          .replace(/^\d+\.\s*/, '') // Remove leading numbers and dots
          .replace(/^["']|["']$/g, '') // Remove quotes
          .trim(); // Remove extra whitespace
      })
      .filter((title: string) => title); // Remove empty titles

    return NextResponse.json({ titles });
  } catch (error) {
    console.error('Error generating titles:', error);
    return NextResponse.json(
      { error: 'Failed to generate titles' },
      { status: 500 }
    );
  }
} 