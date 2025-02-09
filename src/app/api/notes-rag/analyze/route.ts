import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';
import { promises as fs } from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';


// Set the maximum duration for the route to 35 seconds
export const maxDuration = 35;


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

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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

/**
 * Removes content between <think> and </think> tags and trims whitespace
 * @param text The text to clean
 * @returns Cleaned text with thinking process removed
 */
function removeThinkingProcess(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/g, '')  // Remove content between <think> tags
    .replace(/^\s+|\s+$/gm, '')  // Remove leading/trailing whitespace from each line
    .trim();  // Remove overall leading/trailing whitespace
}

/**
 * Extracts just the note content from JSON formatted examples
 * @param examples String containing JSON formatted examples
 * @returns String with only the note contents, separated by newlines
 */
function extractNotesFromJson(examples: string): string {
  try {
    // Split the input into lines and process each line
    const processedNotes = examples
      .split('\n')
      .filter(line => line.trim())  // Remove empty lines
      .map(line => {
        try {
          const parsed = JSON.parse(line);
          return `"${parsed.note}"`;  // Wrap note in quotes
        } catch {
          // If line isn't valid JSON, return it as-is
          return line;
        }
      })
      .filter(note => note);  // Remove empty notes

    // Join with clear separation between examples
    return processedNotes.join('\n\n---\n\n');
  } catch (error) {
    console.error('Error extracting notes:', error);
    return examples;  // Return original if processing fails
  }
}

/**
 * Parses the generated content into separate notes
 * @param content The generated content to parse
 * @returns Object containing short notes and long-form note
 */
function parseGeneratedNotes(content: string): { shortNotes: string[], longFormNote: string } {
  // Initialize result object
  const result = {
    shortNotes: [] as string[],
    longFormNote: ''
  };

  try {
    // Split content by triple dashes
    const parts = content.split('---').map(part => part.trim());
    
    // Process each part
    parts.forEach(part => {
      if (part.toLowerCase().includes('long-form note:')) {
        // This is the long-form note - split into sentences
        const sentences = part
          .split(/(?<=[.!?])\s+/)
          .map(s => s.trim())
          .filter(s => s);
        result.longFormNote = sentences.join('\n');
      } else if (part.trim()) {
        // This is a short note - split into sentences
        const cleanedNote = part
          .replace(/^\*\*Note \d+:\s*/, '')  // Remove "**Note X:" prefix
          .replace(/\*\*/g, '')              // Remove any remaining asterisks
          .trim();
        
        if (cleanedNote) {
          // Split into sentences and join with newlines
          const sentences = cleanedNote
            .split(/(?<=[.!?])\s+/)
            .map(s => s.trim())
            .filter(s => s);
          result.shortNotes.push(sentences.join('\n'));
        }
      }
    });

    return result;
  } catch (error) {
    console.error('Error parsing generated notes:', error);
    // If parsing fails, split the entire content into sentences
    const sentences = content
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s);
    return {
      shortNotes: [sentences.join('\n')],
      longFormNote: ''
    };
  }
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
  let prompt = 'Act like a seasoned Substack creator who consistently goes viral with concise, impactful notes. You speak plainly, challenge assumptions, and avoid fluff. Every sentence should be punchy, authentic, and grounded in real-world insights.Below are examples of viral Substack notes that have gathered high engagement:\n\n';
  retrievedExamples.forEach((ex, i) => {
    prompt += `Example ${i + 1}:\n${ex.note}\n\n`;
  });

  const basePrompt = `
Based off the examples above, write 3 highly engaging notes designed to go viral. Keep them concise, punchy, and impactful. Every sentence should stand on its own, creating rhythm and flow. No fluff, no wasted words.

The notes should challenge assumptions, reframe ideas, or create a sense of urgency. It should feel like real talk—natural, conversational, and sharp, without being overly motivational. Focus on clarity and insight, avoiding jargon while still sounding intelligent.

User topic= ${userTopic}
Tailor the note to that topic while maintaining a focus on progress, action, and cutting through distractions. 
If the topic is about Substack, highlight consistency, value, and playing the long game. Also highlight Substack's unique benefits when compared to other platforms. Highlith it's true appeal being it's organic nature, ad-free feed, authentic, real interactions, it beeing cool, it being community-driven, it being a place where people can be themselves, it being a place where people can learn, grow, and connect with others.

For engagement-driven notes, incorporate a strong prompt that encourages reflection or discussion. The goal is to make readers think and want to respond.

Ensure the tone is optimistic but grounded in reality—no empty inspiration, just real insights that resonate.

Output only the notes with no additional explanation. Do not number the notes. Do not output a short 'title' for each note. 
Separate each note with '###---###'. Use markdown formatting.
  `;
  prompt += basePrompt;
  return prompt;
}

// -------------------------------
// API Route Handler
// -------------------------------

/**
 * Next.js App Router API route handler for POST /api/notes-rag/analyze.
 */
export async function POST(req: Request) {
  try {
    const { userTopic, userId } = await req.json();

    if (!userTopic) {
      return NextResponse.json(
        { error: 'No topic provided' },
        { status: 400 }
      );
    }

    // Read the entire JSONL file
    const filePath = path.join(process.cwd(), 'data', 'substack_examples.jsonl');
    const fileContents = await fs.readFile(filePath, 'utf8');

    // First Groq call to select examples
    const exampleSelectionPrompt = `act as an expert content curator and expert Substack writer, the best in the world at publishing engaging, valuable content that always goes viral

From this list of curated viral Substack notes choose the top 3 that would best work as frameworks/templates to write a new Substack post on the THEME defined below. 
Curated list:
${fileContents}

THEME= ${userTopic}

Output only the top 3 examples and no other explanations or other text.
Think through this step by step`;

    const exampleSelectionResponse = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: exampleSelectionPrompt,
        },
      ],
      model: 'deepseek-r1-distill-llama-70b',
      temperature: 1.34,
      max_tokens: 11150,
      top_p: 0.95,
      stream: false,
    });

    const rawSelectedExamples = exampleSelectionResponse.choices[0]?.message?.content || '';
    const cleanedFromThinking = removeThinkingProcess(rawSelectedExamples);
    const selectedExamples = extractNotesFromJson(cleanedFromThinking);

    // Build the main prompt using the selected examples
    const prompt = buildPrompt(retrieveExamples(userTopic, 3), userTopic);

    // Second Groq call for generating the final content
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'deepseek-r1-distill-llama-70b',
      temperature: 1.37,
      max_tokens: 11150,
      top_p: 0.95,
      stream: false,
    });

    const rawResult = completion.choices[0]?.message?.content || '';
    const cleanedResult = removeThinkingProcess(rawResult);
    const parsedNotes = parseGeneratedNotes(cleanedResult);

    return NextResponse.json({
      result: {
        shortNotes: parsedNotes.shortNotes,
        longFormNote: parsedNotes.longFormNote
      },
      selectedExamples: selectedExamples
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
} 