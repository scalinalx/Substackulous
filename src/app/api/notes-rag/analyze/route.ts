import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import Groq from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

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
// Initialization and Data Loading
// -------------------------------

let initialized = false;
let examples: NoteExample[] = [];

/**
 * Initializes the system by loading examples from the JSONL file.
 */
async function init() {
  if (initialized) return;

  try {
    const filePath = path.join(process.cwd(), 'data', 'substack_examples.jsonl');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    examples = fileContent
      .split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line));
    initialized = true;
  } catch (error) {
    console.error('Error loading examples:', error);
    throw error;
  }
}

// -------------------------------
// Text Processing Functions
// -------------------------------

/**
 * Calculates text similarity based on word overlap.
 * @param text1 First text to compare
 * @param text2 Second text to compare
 * @returns Similarity score between 0 and 1
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\W+/).filter(Boolean);
  const words2 = text2.toLowerCase().split(/\W+/).filter(Boolean);
  
  const set1 = Array.from(new Set(words1));
  const set2 = Array.from(new Set(words2));
  
  const intersection = set1.filter(word => set2.includes(word));
  const union = Array.from(new Set([...set1, ...set2]));
  
  return intersection.length / union.length;
}

/**
 * Retrieves examples most similar to the user's topic.
 * @param userTopic The user's input topic
 * @param count Number of examples to retrieve
 * @returns Array of most similar examples
 */
function retrieveExamples(userTopic: string, count: number): NoteExample[] {
  return examples
    .map(example => ({
      ...example,
      similarity: calculateTextSimilarity(userTopic, example.note)
    }))
    .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
    .slice(0, count);
}

// -------------------------------
// Prompt Building
// -------------------------------

/**
 * Builds the complete prompt for the Groq API.
 * @param retrievedExamples Retrieved similar examples
 * @param userTopic User's input topic
 * @returns Complete prompt string
 */
function buildPrompt(retrievedExamples: NoteExample[], userTopic: string): string {
  let prompt = 'Below are examples of viral Substack notes that have gathered high engagement:\n\n';
  retrievedExamples.forEach((ex, i) => {
    prompt += `Example ${i + 1}:\n${ex.note}\n\n`;
  });

  const basePrompt = `
Write 3 highly engaging notes designed to go viral. Keep them concise, punchy, and impactful. Every sentence should stand on its own, creating rhythm and flow. No fluff, no wasted words.

The notes should challenge assumptions, reframe ideas, or create a sense of urgency. It should feel like real talk—natural, conversational, and sharp, without being overly motivational. Focus on clarity and insight, avoiding jargon while still sounding intelligent.

User topic= ${userTopic}
Tailor the note to that theme while maintaining a focus on progress, action, and cutting through distractions. If the topic is about Substack, highlight consistency, value, and playing the long game.

For engagement-driven notes, incorporate a strong prompt that encourages reflection or discussion. The goal is to make readers think and want to respond.

Ensure the tone is optimistic but grounded in reality—no empty inspiration, just real insights that resonate.

After you've finished the task above, output 2 new viral long-form notes that are similar to the user topic and based on the examples.
Output only the notes with no additional explanation.
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
 * @param model The model to use ('llama' or 'deepseek').
 * @returns The generated viral notes as a string.
 */
async function callGroqAPI(prompt: string, model: 'llama' | 'deepseek'): Promise<string> {
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
  });
  
  const messages = [
    { role: 'user' as const, content: prompt }
  ];

  // Call the Groq API with the specified model and parameters
  const chatCompletion = await groq.chat.completions.create(
    model === 'llama' 
      ? {
          messages,
          model: "llama-3.3-70b-specdec",
          temperature: 1,
          max_tokens: 2090,
          top_p: 1,
          stream: false,
          stop: null
        }
      : {
          messages,
          model: "deepseek-r1-distill-llama-70b",
          temperature: 0.69,
          max_tokens: 4096,
          top_p: 0.95,
          stream: false,
          stop: null
        }
  );

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
    const { userTopic, model = 'llama', userId } = body;

    if (!userTopic) {
      return NextResponse.json(
        { error: 'Missing required parameter: userTopic' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user has enough credits
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (profileError) {
      return NextResponse.json({ 
        error: 'Failed to fetch user profile',
        details: profileError.message 
      }, { status: 404 });
    }

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const creditCost = 1;
    if (profile.credits < creditCost) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 });
    }

    // Retrieve the top 3 examples similar to the user topic.
    const retrievedExamples = retrieveExamples(userTopic, 3);
    // Build the complete prompt using the retrieved examples and base instructions.
    const prompt = buildPrompt(retrievedExamples, userTopic);
    console.log('Constructed prompt:', prompt);

    // Call the Groq API to generate the viral notes.
    const generatedNotes = await callGroqAPI(prompt, model as 'llama' | 'deepseek');

    // Remove content between <think> tags and clean up the output
    const cleanedNotes = generatedNotes
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .trim();

    // Deduct credits
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ credits: profile.credits - creditCost })
      .eq('id', userId);

    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to update credits',
        details: updateError.message 
      }, { status: 500 });
    }

    // Return the generated notes.
    return NextResponse.json({ 
      success: true,
      result: cleanedNotes,
      logs: {
        examplesCount: retrievedExamples.length,
        promptLength: prompt.length,
        model
      }
    });
  } catch (error) {
    console.error('Error in note generation:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate notes',
        details: error instanceof Error ? error.stack : 'No stack trace available'
      },
      { status: 500 }
    );
  }
} 