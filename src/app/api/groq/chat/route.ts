import { Groq } from 'groq-sdk';
import { NextRequest } from 'next/server';
import { manageContextHistory } from '@/lib/types/chat';
import { type Message } from 'ai';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

// Create a custom stream response
class StreamingResponse extends Response {
  constructor(readable: ReadableStream) {
    super(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }
}

// Create a custom stream handler
const createStream = () => {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  return {
    stream: stream.readable,
    handlers: {
      onToken: async (token: string) => {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ content: token })}\n\n`));
      },
      onComplete: async () => {
        await writer.close();
      },
      onError: async (error: Error) => {
        await writer.abort(error);
      },
    },
  };
};

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { messages, sessionId } = await req.json();

    // Manage context to stay within limits
    const contextualMessages = manageContextHistory(messages);

    // Create stream
    const { stream, handlers } = createStream();

    // Make call to Groq
    const completion = groq.chat.completions.create({
      messages: contextualMessages,
      model: 'llama-3.3-70b-specdec',
      temperature: 0.69,
      max_tokens: 2048,
      top_p: 0.95,
      stream: true,
      stop: null
    });

    // Convert the response to a friendly stream
    const response = new StreamingResponse(stream);

    // Start the completion
    completion.then(async (result) => {
      for await (const chunk of result) {
        const content = chunk.choices[0]?.delta?.content || '';
        handlers.onToken(content);
      }
      handlers.onComplete();
    }).catch((error) => {
      handlers.onError(error);
    });

    return response;
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate chat response' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 