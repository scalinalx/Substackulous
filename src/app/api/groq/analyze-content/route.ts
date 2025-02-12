import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export const maxDuration = 35;

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "deepseek-r1-distill-llama-70b-specdec",
      temperature: 1.37,
      max_tokens: 8192,
      top_p: 0.95,
      stream: false,
    });

    const result = completion.choices[0]?.message?.content || '';

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Groq API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze content' },
      { status: 500 }
    );
  }
} 