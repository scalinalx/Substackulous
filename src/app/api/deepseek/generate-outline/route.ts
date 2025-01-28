export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { topic, keyPoints, targetAudience } = await req.json();

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

    const prompt = `Create a detailed outline for a viral blog post about ${topic}.
${keyPoints ? `\nKey points to cover:\n${keyPoints}` : ''}
${targetAudience ? `\nTarget audience: ${targetAudience}` : ''}

Please provide a well-structured outline that includes:
1. An attention-grabbing introduction
2. Main sections with clear subpoints
3. Engaging examples or case studies
4. A compelling conclusion
5. Call-to-action

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