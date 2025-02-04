import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { pipeline } from '@xenova/transformers';
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
let exampleEmbeddings: number[][] = [];   // Holds computed embeddings for each note.
let embeddingPipelineInstance: any = null; // The transformer pipeline instance.
let initialized = false;                  // Flag to ensure one-time initialization.

// -------------------------------
// Initialization Function
// -------------------------------

/**
 * Initializes the system by:
 * - Loading the transformer model.
 * - Reading the JSONL file from the data folder.
 * - Computing and caching embeddings for each note.
 */
async function init(): Promise<void> {
  if (initialized) return;

  console.log('Loading transformer model...');
  // Load the feature-extraction pipeline from @xenova/transformers with model "Xenova/all-mpnet-base-v2".
  embeddingPipelineInstance = await pipeline('feature-extraction', 'Xenova/all-mpnet-base-v2');

  // Read the JSONL file from the "data" folder.
  const filePath = path.join(process.cwd(), 'data', 'substack_examples.jsonl');
  const content = await fs.readFile(filePath, 'utf8');
  const lines = content.split('\n').filter(Boolean);
  examples = lines.map(line => JSON.parse(line) as NoteExample);

  console.log(`Loaded ${examples.length} examples. Computing embeddings...`);
  // Compute embeddings for each note.
  exampleEmbeddings = await Promise.all(
    examples.map(async (ex) => await getEmbedding(ex.note))
  );

  initialized = true;
  console.log('Initialization complete.');
}

// -------------------------------
// Embedding Helpers
// -------------------------------

/**
 * Computes the embedding for the provided text using the transformer pipeline.
 * Applies average pooling over token embeddings.
 * @param text The text to compute the embedding for.
 * @returns A numeric vector representing the embedding.
 */
async function getEmbedding(text: string): Promise<number[]> {
  const tokenEmbeddings = (await embeddingPipelineInstance(text)) as number[][];
  return averagePooling(tokenEmbeddings);
}

/**
 * Averages token-level embeddings to create a single embedding vector.
 * @param tokenEmbeddings An array of embeddings (one per token).
 * @returns The averaged embedding vector.
 */
function averagePooling(tokenEmbeddings: number[][]): number[] {
  const tokenCount = tokenEmbeddings.length;
  const dim = tokenEmbeddings[0].length;
  const avg = new Array(dim).fill(0);
  for (const token of tokenEmbeddings) {
    for (let i = 0; i < dim; i++) {
      avg[i] += token[i];
    }
  }
  for (let i = 0; i < dim; i++) {
    avg[i] /= tokenCount;
  }
  return avg;
}

/**
 * Computes cosine similarity between two vectors.
 * @param a Vector a.
 * @param b Vector b.
 * @returns The cosine similarity value.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dot / (normA * normB);
}

// -------------------------------
// Retrieval and Prompt Building
// -------------------------------

/**
 * Retrieves the top K note examples that are most similar to the provided query.
 * @param query The user-provided topic.
 * @param topK Number of examples to retrieve.
 * @returns An array of the top K note examples.
 */
async function retrieveExamples(query: string, topK: number): Promise<NoteExample[]> {
  const queryEmbedding = await getEmbedding(query);
  const similarities = exampleEmbeddings.map((emb, idx) => ({
    index: idx,
    similarity: cosineSimilarity(queryEmbedding, emb)
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
    const retrievedExamples = await retrieveExamples(userTopic, 3);
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