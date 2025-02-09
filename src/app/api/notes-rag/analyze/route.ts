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
 * @param selectedExamples Selected example notes as a string
 * @param userTopic User's input topic
 * @returns Complete prompt string
 */
function buildPrompt(selectedExamples: string, userTopic: string): string {
  let prompt = `Act like a seasoned Substack creator who consistently goes viral with concise, impactful notes. 
You speak plainly, challenge assumptions, and avoid fluff. 
Every sentence should be punchy and standalone.
Below are 3 example viral Substack notes:\n\n`;

  // Add the selected examples directly
  prompt += selectedExamples + '\n\n';

  const basePrompt = `
User topic= ${userTopic}

Rewrite each example note to focus on the user topic.
- Transform each example into a new note on this topic.
- Keep the same structure, same bullet points, same line breaks, and overall length.
- Rewrite sentences to avoid duplication but keep the tone, style, and formatting of the original.
- For instance, if a note starts with a short story, keep it as a short story but adapt it to ${userTopic}.
- If a note ends with a direct prompt, do so here as well.
- Output exactly 3 rewritten notes, separated by the Markdown delimiter:

###---###

Output only the notes. 
No explanations, no numbering, no extra commentary.

[EXAMPLE OUTPUT FORMAT]

Note 1
###---###
Note 2
###---###
Note 3
  `;
  prompt += basePrompt;
  return prompt;
}

/**
 * Builds the complete prompt for long-form note generation.
 * @param selectedExamples Selected example long-form notes as a string
 * @param userTopic User's input topic
 * @returns Complete prompt string
 */
function buildLongFormPrompt(selectedExamples: string, userTopic: string): string {
  let prompt = `Act like a seasoned Substack creator who consistently goes viral with impactful, long-form notes. 
A long-form note has a length of over 400 words, and is either EDUCATIONAL or shares a PERSONAL STORY. 
You speak plainly, challenge assumptions, and avoid fluff. 
Every sentence should be punchy and standalone.
Below are 3 example viral Substack long-form notes:\n\n`;

  // Add the selected examples directly
  prompt += selectedExamples + '\n\n';

  const basePrompt = `
User topic= ${userTopic}

Rewrite each example note to focus on the user topic.
- Transform each example into a new note on this topic.
- Keep the same structure, same bullet points, same line breaks.
- Make sure the notes you output contain at least 400 words.
- Write each sentence on a new line.
- Focus on notes that have either a strong EDUCATIONAL intent, or share a PERSONAL STORY - as these are the ones that work best as long-form notes. 
- Rewrite sentences to avoid duplication but keep the tone, style, and formatting of the original.
- For instance, if a note starts with a short story, keep it as a short story but adapt it to ${userTopic}.
- If a note ends with a direct prompt, do so here as well.
- Output exactly 3 rewritten notes, separated by the Markdown delimiter:

###---###

Output only the notes. 
No explanations, no numbering, no extra commentary.

[EXAMPLE OUTPUT FORMAT]

Note 1
###---###
Note 2
###---###
Note 3`;

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
    const { userTopic, userId, isLongForm } = await req.json();

    if (!userTopic) {
      return NextResponse.json(
        { error: 'No topic provided' },
        { status: 400 }
      );
    }

    // Read the entire JSONL file
    const filePath = path.join(process.cwd(), 'data', 'substack_examples.jsonl');
    const fileContents = await fs.readFile(filePath, 'utf8');

    // If it's a long-form request, use different example selection
    if (isLongForm) {
      const exampleLongSelectionPrompt = `Act as an expert content curator and expert Substack writer, the best in the world at publishing engaging, valuable content that always goes viral

From this list of curated viral Substack notes choose the top 3 that would best work as frameworks/templates to write a new Substack long-form note on the THEME defined below. PRIORITIZE EXAMPLES THAT ARE EITHER EDUCATIONAL OR SHARE A PERSONALY STORY AND ARE LONGER THAN 8 SENTENCES. 
Curated list:
${fileContents}

THEME= ${userTopic}

Output only the top 3 examples and no other explanations or other text.
Think through this step by step`;

      const exampleLongSelectionResponse = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: exampleLongSelectionPrompt,
          },
        ],
        model: 'deepseek-r1-distill-llama-70b',
        temperature: 1.34,
        max_tokens: 11150,
        top_p: 0.95,
        stream: false,
      });

      const rawSelectedExamples = exampleLongSelectionResponse.choices[0]?.message?.content || '';
      const cleanedFromThinking = removeThinkingProcess(rawSelectedExamples);
      const selectedExamples = extractNotesFromJson(cleanedFromThinking);

      console.log("Long-form selected examples:", selectedExamples);

      // Build the long-form prompt using the selected examples
      const longFormPrompt = buildLongFormPrompt(selectedExamples, userTopic);
      console.log("Final long-form prompt being sent to LLM:", longFormPrompt);

      // Generate the long-form notes using Groq
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: longFormPrompt,
          },
        ],
        model: 'llama-3.3-70b-specdec',
        temperature: 1.37,
        max_tokens: 3200,
        top_p: 1,
        stream: false,
      });

      const rawResult = completion.choices[0]?.message?.content || '';
      const cleanedResult = removeThinkingProcess(rawResult);
      const parsedNotes = parseGeneratedNotes(cleanedResult);

      return NextResponse.json({
        result: {
          shortNotes: [],
          longFormNote: parsedNotes.shortNotes.join('\n\n###---###\n\n')
        },
        selectedExamples: selectedExamples
      });
    }

    // Original short-form note generation code
    const exampleSelectionPrompt = `Act as an expert content curator and expert Substack writer, the best in the world at publishing engaging, valuable content that always goes viral

From this list of curated viral Substack notes choose the top 3 that would best work as frameworks/templates to write a new Substack note on the THEME defined below. 
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

    // Build the main prompt using the selected examples from the first API call
    const prompt = buildPrompt(selectedExamples, userTopic);
    console.log("Final prompt being sent to LLM:", prompt); // Add logging to verify the prompt

    // Second Groq call for generating the final content
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-specdec',
      temperature: 1.37,
      max_tokens: 3200,
      top_p: 1,
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