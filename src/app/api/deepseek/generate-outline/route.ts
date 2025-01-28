export const runtime = 'edge';

import { NextResponse } from 'next/server';

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
      wordCount
    } = await req.json();

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    if (!DEEPSEEK_API_KEY) {
      throw new Error('Deepseek API key not configured');
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
        max_tokens: 2000,
        temperature: 0.7,
        top_p: 1.0
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate outline');
    }

    const data = await response.json();
    const outline = data.choices[0]?.message?.content;

    if (!outline) {
      throw new Error('No outline generated');
    }

    return NextResponse.json({ outline });
  } catch (error) {
    console.error('Error generating outline:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
} 