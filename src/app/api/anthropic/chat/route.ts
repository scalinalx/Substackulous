export const runtime = 'edge';

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    // Create a TransformStream for streaming the response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // Start the response stream
    const response = new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

    // Process the chat completion in the background
    (async () => {
      try {
        const completion = await anthropic.messages.create({
          model: 'claude-3-opus-20240229',
          max_tokens: 1000,
          messages,
          stream: true,
        });

        for await (const chunk of completion) {
          if (chunk.type === 'content_block_delta' && 'text' in chunk.delta) {
            await writer.write(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'completion',
                  content: chunk.delta.text,
                })}\n\n`
              )
            );
          }
        }

        // Send completion message
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'done' })}\n\n`
          )
        );
      } catch (error) {
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'error',
              message: (error as Error).message,
            })}\n\n`
          )
        );
      } finally {
        await writer.close();
      }
    })();

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 