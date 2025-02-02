import { Groq } from 'groq-sdk';
import { NextRequest } from 'next/server';
import { manageContextHistory } from '@/lib/types/chat';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  id?: string;
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { messages, sessionId } = await req.json();

    // Format messages for Groq API
    const formattedMessages = messages.map((msg: ChatMessage) => ({
      role: msg.role,
      content: msg.content
    }));

    // Log the request for debugging
    console.log('Request messages:', formattedMessages);

    // Make call to Groq without streaming
    const completion = await groq.chat.completions.create({
      messages: formattedMessages,
      model: 'llama-3.3-70b-specdec',
      temperature: 0.69,
      max_tokens: 2048,
      top_p: 0.95,
      stream: false,
      stop: null
    });

    // Log the response for debugging
    console.log('Groq response:', completion);

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
    // Detailed error logging
    console.error('Chat error details:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error
    });

    // Return a more informative error response
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate chat response',
        type: error instanceof Error ? error.constructor.name : typeof error
      }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
} 