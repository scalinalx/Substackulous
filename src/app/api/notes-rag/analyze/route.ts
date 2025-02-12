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
    // Use the clean version of the file
    const filePath = path.join(process.cwd(), 'data', 'substack_examples_clean.jsonl');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    // Split by newlines and process each line individually
    examples = fileContent
      .split('\n')
      .filter(line => line.trim()) // Remove empty lines
      .map(line => {
        try {
          const parsed = JSON.parse(line);
          if (!parsed.note || typeof parsed.note !== 'string') {
            console.warn('Invalid note format:', line);
            return null;
          }
          return {
            note: parsed.note,
            likes: parsed.likes || 0
          };
        } catch (parseError) {
          console.warn('Failed to parse line:', line, parseError);
          return null;
        }
      })
      .filter(example => example !== null); // Remove failed parses

    if (examples.length === 0) {
      throw new Error('No valid examples found in file');
    }

    console.log(`Successfully loaded ${examples.length} examples`);
    initialized = true;
  } catch (error) {
    console.error('Error loading examples:', error);
    // Initialize with empty array instead of throwing
    examples = [];
    initialized = true; // Still mark as initialized to prevent repeated attempts
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
    const parts = content.split('###---###').map(part => part.trim());
    
    // Process each part
    parts.forEach(part => {
      if (part.toLowerCase().includes('long-form note:')) {
        // This is the long-form note - split into sentences
        const sentences = part
          .replace(/^long-form note:\s*/i, '') // Remove "Long-form Note:" prefix
          .split(/(?<=[.!?])\s+/)
          .map(s => s.trim())
          .filter(s => s);
        
        // Make first sentence bold
        if (sentences.length > 0) {
          sentences[0] = `**${sentences[0]}**`;
        }
        
        result.longFormNote = sentences.join('\n');
      } else if (part.trim()) {
        // Remove "Note:" or "Note X:" prefix
        const cleanedNote = part
          .replace(/^note\s*\d*:\s*/i, '')  // Remove "Note:" or "Note X:" prefix
          .trim();
        
        if (cleanedNote) {
          // Split into sentences
          const sentences = cleanedNote
            .split(/(?<=[.!?])\s+/)
            .map(s => s.trim())
            .filter(s => s);
          
          // Make first sentence bold
          if (sentences.length > 0) {
            sentences[0] = `**${sentences[0]}**`;
          }
          
          // Join sentences with newlines
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
    
    // Make first sentence bold
    if (sentences.length > 0) {
      sentences[0] = `**${sentences[0]}**`;
    }
    
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
Every sentence should be punchy and standalone. Use only natural language, speak plaiin English. The notes should be written in a way that is easy to understand and follow even by someone who is 12 years old.
Below are 5 example viral Substack notes:\n\n`;

  prompt += selectedExamples + '\n\n';

  const basePrompt = `
User topic= ${userTopic}

Rewrite each example note to focus on the user topic.
- Transform each example into a new note on this topic.
- Keep the same structure, same bullet points, same line breaks, and overall length.
- Rewrite sentences to avoid duplication but keep the tone, style, and formatting of the original.
- For instance, if a note starts with a short story, keep it as a short story but adapt it to ${userTopic}.
- If a note ends with a direct prompt, do so here as well.
- Output exactly 5 rewritten notes, separated by the Markdown delimiter:

###---###

Output only the notes. 
No explanations, no numbering, no extra commentary.

[EXAMPLE OUTPUT FORMAT]

Note 1
###---###
Note 2
###---###
Note 3
###---###
Note 4
###---###
Note 5`;

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

/**
 * Builds the prompt for selecting the most appropriate examples
 * @param allExamples All available examples from the JSONL file
 * @param userTopic User's input topic
 * @returns Selection prompt string
 */
function buildExampleSelectionPrompt(allExamples: NoteExample[], userTopic: string): string {
  const examplesText = allExamples.map(ex => `Note: ${ex.note}\nLikes: ${ex.likes || 0}`).join('\n\n');
  
  return `You are an expert content curator for Substack. Your task is to select the 5 most relevant and high-performing examples from the provided list that would work best as templates/inspiration for writing about the user's topic.

USER'S TOPIC: ${userTopic}

SELECTION CRITERIA:
1. Relevance to the topic (either direct topic match or similar content structure that could be adapted)
2. Performance (indicated by likes)
3. Diversity in writing styles (to provide varied templates)
4. Strong hooks and viral potential
5. Clear structure that can be replicated

Below are all available examples with their engagement metrics:

${examplesText}

Select exactly 5 examples that would work best as templates for writing about "${userTopic}".
Return ONLY the selected notes, separated by ###---###.
Do not include the likes count or any explanations.
Think through this step by step, but only output the final selection.`;
}

// -------------------------------
// API Route Handler
// -------------------------------

/**
 * Next.js App Router API route handler for POST /api/notes-rag/analyze.
 */
export async function POST(req: Request) {
  try {
    const { userTopic, userId, model = 'deepseek', isLongForm = false } = await req.json();

    if (!userTopic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // Initialize if needed
    if (!initialized) {
      await init();
    }

    // Step 1: Use LLM to select the most appropriate examples
    console.log("Step 1: Selecting examples with LLM");
    const selectionPrompt = buildExampleSelectionPrompt(examples, userTopic);
    console.log("Example selection prompt:", selectionPrompt);

    const selectionCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: selectionPrompt,
        },
      ],
      model: "llama-3.3-70b-specdec",
      temperature: 0.7, // Lower temperature for more focused selection
      max_tokens: 4000,
      top_p: 0.95,
      stream: false,
    });

    const selectedExamplesText = selectionCompletion.choices[0]?.message?.content || '';
    console.log("Selected examples:", selectedExamplesText);

    // Step 2: Generate new notes using the selected examples
    console.log("Step 2: Generating new notes using selected examples");
    const generationPrompt = buildPrompt(selectedExamplesText, userTopic);
    console.log("Final generation prompt:", generationPrompt);

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: generationPrompt,
        },
      ],
      model: "llama-3.3-70b-specdec",
      temperature: 1.37,
      max_tokens: 3200,
      top_p: 1,
      stream: false,
    });

    const result = completion.choices[0]?.message?.content || '';
    const cleanedResult = removeThinkingProcess(result);

    return NextResponse.json({
      result: {
        shortNotes: cleanedResult.split('###---###').map(note => note.trim()),
        longFormNote: ''
      },
      selectedExamples: selectedExamplesText
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze content' },
      { status: 500 }
    );
  }
} 