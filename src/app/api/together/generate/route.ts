import { NextResponse } from 'next/server';
import Together from 'together-ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Helper function to accumulate tokens from the stream.
async function accumulateStream(stream: AsyncIterable<any>): Promise<string> {
  let message = "";
  for await (const token of stream) {
    const content = token.choices[0]?.delta?.content;
    if (content) {
      message += content;
    }
  }
  return message;
}

export async function POST(req: Request) {
  try {
    // Parse the input parameters from the request body.
    const { systemPrompt, userPrompt, model, temperature } = await req.json();
    if (!userPrompt) {
      return NextResponse.json({ error: "User prompt is required" }, { status: 400 });
    }

    // Set default values if not provided.
    const chosenSystemPrompt = systemPrompt || "";
    const chosenModel = model || "meta-llama/Llama-3-70b-chat-hf";
    const chosenTemperature = typeof temperature === "number" ? temperature : 0.7;

    // Initialize Together AI client.
    const together = new Together();

    // Create the Together AI chat completion request.
    const stream = await together.chat.completions.create({
      messages: [
        {
          role: "system",
          content: chosenSystemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      model: chosenModel,
      max_tokens: 8192,
      temperature: chosenTemperature,
      top_p: 0.7,
      top_k: 50,
      repetition_penalty: 1,
      stop: ["<|eot_id|>"],
      stream: true,
    });

    // Accumulate the stream tokens into a complete message.
    const result = await accumulateStream(stream);

    // Return the accumulated result.
    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error in TogetherAI call:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
