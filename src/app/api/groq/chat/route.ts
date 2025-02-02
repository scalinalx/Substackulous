import { Groq } from 'groq-sdk';
import { NextRequest } from 'next/server';
import { manageContextHistory } from '@/lib/types/chat';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { messages, sessionId } = await req.json();

    // Manage context to stay within limits
    const contextualMessages = manageContextHistory(messages);

    // Make call to Groq without streaming
    const completion = await groq.chat.completions.create({
      messages: contextualMessages,
      model: 'llama-3.3-70b-specdec',
      temperature: 0.69,
      max_tokens: 2048,
      top_p: 0.95,
      stream: false,
      stop: null
    });

    // Return the complete response
    return new Response(
      JSON.stringify({ 
        role: 'assistant',
        content: completion.choices[0].message.content,
        id: Math.random().toString(36).substring(7)
      }), 
      { 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate chat response' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 