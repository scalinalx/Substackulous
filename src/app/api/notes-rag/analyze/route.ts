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
    // Parse the topic from the request body.
    const { topic } = await req.json();
    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    // Build the prompt using your instructions.
    const prompt = `
USER TOPIC = ${topic}

Write 5 highly engaging notes designed to go viral on the USER TOPIC above. Keep them engaging, punchy, and impactful. Every sentence should stand on its own, creating rhythm and flow. No fluff, no wasted words.

The notes should challenge assumptions, reframe ideas, or create a sense of urgency. It should feel like real talk—natural, conversational, and sharp, without being overly motivational. Focus on clarity and insight, avoiding jargon while still sounding intelligent.

Tailor the notes to the theme of USER TOPIC while maintaining a focus on progress, action, and cutting through distractions. 

If the topic is about Substack, highlight consistency, value, and playing the long game. Highlight Substack's advantages over other social media platforms, its organic nature.

For engagement-driven notes, incorporate a strong prompt that encourages reflection or discussion. The goal is to make readers think and want to respond.

Each note should start with a strong hook. What's a strong hook?

It's creative. Outside the box. Eye-catching. It creates an emotion, a feeling. It makes people stop scrolling.

A great hook has maximum 10 words, always contains a number, an intriguing question, or a surprising statistic. 
Best if written from the perspective of the reader. 
The hook is always followed by a re-hook in the first sentence of the note.

It avoids jargon, fancy words, questions, emojis at all costs. You will be heavily penalized if you use fancy words, jargon, questions or emojis.

Ensure the tone is optimistic but grounded in reality—no empty inspiration, just real insights that resonate.
Each sentence should be written on a new line. 
Maximize readability through structure and formatting. 
Use short & sweet sentences that pack a punch and are easily digestible.
Separate each note with the markdown delimiter ###---###.
Ensure a balanced mixture of short-form and long-form notes. 
Short form notes are concise, punchy and easy to read.
Long-form notes are educational, personal and share a story. Long-form notes have at least 400 words. 
Output only the notes and nothing else—no explanations or additional content.
DO NOT END YOUR NOTES WITH A QUESTION!
Think through this step by step.
    `.trim();

    // Initialize Together AI.
    const together = new Together();

    // First API call: using the Turbo model.
    const streamTurbo = await together.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Act like a seasoned Substack creator who consistently goes viral with impactful notes."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
      max_tokens: 4096,
      temperature: 0.7,
      top_p: 0.7,
      top_k: 50,
      repetition_penalty: 1,
      stop: ["<|eot_id|>"],
      stream: true
    });

    // Second API call: using the Llama model.
    const streamLlama = await together.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Act like a seasoned Substack creator who consistently goes viral with impactful notes."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "meta-llama/Llama-3-70b-chat-hf",
      max_tokens: 4096,
      temperature: 1.24,
      top_p: 0.7,
      top_k: 50,
      repetition_penalty: 1,
      stop: ["<|eot_id|>"],
      stream: true
    });

    // Accumulate both streams concurrently.
    const [notesTurbo, notesLlama] = await Promise.all([
      accumulateStream(streamTurbo),
      accumulateStream(streamLlama)
    ]);

    // Return both results.
    return NextResponse.json({ notesTurbo, notesLlama });
  } catch (error) {
    console.error("Error in TogetherAI call:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
