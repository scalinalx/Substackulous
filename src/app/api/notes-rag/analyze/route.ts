import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import Groq from 'groq-sdk';

// -------------------------------
// Type Definitions
// -------------------------------

/**
 * Defines the structure of a note example.
 */
type NoteExample = {
  note: string;
  likes?: number;
};

// -------------------------------
// Global Caches
// -------------------------------

let examples: NoteExample[] = [];       // Holds the list of note examples.
let initialized = false;                  // Flag to ensure one-time initialization.

// -------------------------------
// Initialization Function
// -------------------------------

/**
 * Initializes the system by loading examples from the JSONL file.
 */
async function init(): Promise<void> {
  if (initialized) return;

  // Read the JSONL file from the "data" folder.
  const filePath = path.join(process.cwd(), 'data', 'substack_examples.jsonl');
  const content = await fs.readFile(filePath, 'utf8');
  const lines = content.split('\n').filter(Boolean);
  examples = lines.map(line => JSON.parse(line) as NoteExample);

  initialized = true;
  console.log('Initialization complete with', examples.length, 'examples');
}

// -------------------------------
// Similarity Helpers
// -------------------------------

/**
 * Simple text similarity based on word overlap and topic relevance.
 * This is a basic implementation that could be improved with proper embeddings.
 */
function getTextSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\W+/);
  const words2 = text2.toLowerCase().split(/\W+/);
  
  // Convert arrays to Sets for unique values
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  // Calculate intersection
  const intersection = words1.filter(word => set2.has(word));
  const uniqueIntersection = new Set(intersection);
  
  // Calculate union
  const allWords = [...words1, ...words2];
  const uniqueUnion = new Set(allWords);
  
  return uniqueIntersection.size / uniqueUnion.size;
}

/**
 * Retrieves the top K note examples that are most similar to the provided query.
 * @param query The user-provided topic.
 * @param topK Number of examples to retrieve.
 * @returns An array of the top K note examples.
 */
function retrieveExamples(query: string, topK: number): NoteExample[] {
  const similarities = examples.map((ex, idx) => ({
    index: idx,
    similarity: getTextSimilarity(query, ex.note)
  }));
  
  similarities.sort((a, b) => b.similarity - a.similarity);
  const topIndices = similarities.slice(0, topK).map(item => item.index);
  return topIndices.map(i => examples[i]);
}

/**
 * Builds the complete prompt for the model by combining the retrieved examples and a fixed base prompt.
 * @param retrievedExamples The top note examples retrieved.
 * @param userTopic The user-provided topic.
 * @returns The complete prompt as a string.
 */
function buildPrompt(retrievedExamples: NoteExample[], userTopic: string): string {
  let prompt = 'Below are examples of viral Substack notes that have gathered high engagement:\n\n';
  retrievedExamples.forEach((ex, i) => {
    prompt += `Example ${i + 1}:\n${ex.note}\n\n`;
  });

  const basePrompt = `
Write 4 short, highly engaging notes designed to go viral. Keep them concise, punchy, and impactful. Every sentence should stand on its own, creating rhythm and flow. No fluff, no wasted words.

The notes should challenge assumptions, reframe ideas, or create a sense of urgency. It should feel like real talk—natural, conversational, and sharp, without being overly motivational. Focus on clarity and insight, avoiding jargon while still sounding intelligent.

User topic= ${userTopic}
Tailor the note to that theme while maintaining a focus on progress, action, and cutting through distractions. If the topic is about Substack, highlight consistency, value, and playing the long game.

For engagement-driven notes, incorporate a strong prompt that encourages reflection or discussion. The goal is to make readers think and want to respond.

Ensure the tone is optimistic but grounded in reality—no empty inspiration, just real insights that resonate.
  `;
  prompt += basePrompt;
  return prompt;
}

// -------------------------------
// Calling the Groq API
// -------------------------------

/**
 * Calls the Groq API using groq-sdk with streaming disabled.
 * @param prompt The complete prompt to send to the API.
 * @returns The generated viral notes as a string.
 */
async function callGroqAPI(prompt: string): Promise<string> {
  const groq = new Groq();
  const messages = [
    { role: 'user' as const, content: prompt }
  ];

  // Call the Groq API with "stream": false so that the full response is returned at once.
  const chatCompletion = await groq.chat.completions.create({
    messages,
    model: "llama-3.3-70b-specdec",
    temperature: 1,
    max_completion_tokens: 2090,
    top_p: 1,
    stream: false,
    stop: null
  });

  return chatCompletion.choices[0]?.message?.content || '';
}

// -------------------------------
// API Route Handler
// -------------------------------

/**
 * Next.js App Router API route handler for POST /api/notes-rag/analyze.
 */
export async function POST(request: Request) {
  try {
    // Initialize the system if not already done.
    await init();

    const body = await request.json();
    const { userTopic } = body;

    if (!userTopic) {
      return NextResponse.json(
        { error: 'Missing required parameter: userTopic' },
        { status: 400 }
      );
    }

    // Retrieve the top 3 examples similar to the user topic.
    const retrievedExamples = retrieveExamples(userTopic, 3);
    // Build the complete prompt using the retrieved examples and base instructions.
    const prompt = buildPrompt(retrievedExamples, userTopic);
    console.log('Constructed prompt:', prompt);

    // Call the Groq API to generate the viral notes.
    const generatedNotes = await callGroqAPI(prompt);

    // Return the generated notes.
    return NextResponse.json({ 
      success: true,
      result: generatedNotes,
      logs: {
        examplesCount: retrievedExamples.length,
        promptLength: prompt.length,
      }
    });
  } catch (error: any) {
    console.error('Error in notes-rag analyze:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal Server Error',
      },
      { status: 500 }
    );
  }
} 