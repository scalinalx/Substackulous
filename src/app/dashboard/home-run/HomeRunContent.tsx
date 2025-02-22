'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { toast } from 'sonner';

interface Post {
  title: string;
  excerpt: string;
}

interface AnalysisResults {
  analysis: string;
  ideas: string; // For full viral ideas (used when mode === 'brainstorm')
  notes: string; // For the 3 notes (used when mode === 'notes')
}

export default function HomeRunContent() {
  const { user, profile, credits, updateCredits } = useAuth();
  const [substackUrl, setSubstackUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [results, setResults] = useState<AnalysisResults>({ analysis: '', ideas: '', notes: '' });
  const [activeSection, setActiveSection] = useState<'brainstorm' | 'notes' | 'post' | null>(null);
  const creditCost = 3;

  // Constructs the analysis prompt using only the first 20 posts.
  const constructPrompt = (posts: Post[]) => {
    const postsSection = posts.map(post => `${post.title}\n${post.excerpt}\n`).join('\n');
    const promptText = `You are an expert content analyst and Substack content coach. I will provide you with a collection of Substack posts, where each post includes a headline and a 500‑character snippet. Your task is to analyze this collection and extract detailed patterns across the following dimensions:

Formatting:
How are the headlines structured (capitalization, punctuation, use of symbols, etc.)?
What is the layout of the snippets? (e.g., paragraph breaks, bullet points, emphasis on certain phrases)
Please extract all formatting patterns that contribute to making the winners win. 

Tone and Voice:
What overall tone do the posts convey (e.g., energetic, authoritative, conversational, humorous)?
What type of voice is used (first-person narrative, objective analysis, direct address to the reader)?

Style:
What are the common stylistic features? (e.g., use of rhetorical questions, metaphors, analogies, descriptive language, technical jargon)
Are there consistent language choices or sentence structures?

Topics and Themes:
What recurring subjects or topics do the posts cover (e.g., Bitcoin, economic cycles, market trends)?
Identify any common themes or ideas that appear across the posts.

Ideas and Concepts:
What innovative or recurring ideas are present? (e.g., predictions, strategies, risk management approaches, call-to-action elements)

After you extract and list the patterns in each of these categories, please provide a detailed, comprehensive, insightful and nuanced structured summary that:
1. Describes the overall style, tone, and voice of the content creator.
2. Highlights the key topics and themes.

Input (sorted in descending order by Total Engagement):

${postsSection}

Provide your answer in a structured format with clear headings for each category (Formatting, Tone and Voice, Style, Topics and Themes, Ideas).

Be as detailed as possible. Focus on highlighting what makes winners win. 
Think through this step by step.`;
    console.log('Constructed Analysis Prompt:', promptText);
    return promptText;
  };

  // This function performs one API call that generates the final output based on the mode.
  const analyzeWithGroq = async (prompt: string, mode: 'brainstorm' | 'notes' | 'post'): Promise<AnalysisResults> => {
    try {
      let ideasResult = '';
      let notesResult = '';
      let cleanedAnalysis = '';

      if (mode === 'brainstorm') {
        console.log('Starting analysis API call with prompt for Brainstorm...');
        const analysisResponse = await fetch('/api/groq/analyze-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, model: 'llama-3.3-70b-specdec', temperature: 0.62 }),
        });
        console.log('Analysis API call completed for Brainstorm.');
        if (!analysisResponse.ok) {
          const error = await analysisResponse.json();
          throw new Error(error.message || 'Failed to analyze content');
        }
        const analysisData = await analysisResponse.json();
        cleanedAnalysis = analysisData.result.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
        console.log('Cleaned Analysis (Brainstorm):', cleanedAnalysis);

        // Build combined prompt for viral ideas.
        const combinedIdeasPrompt = `Based on the following analysis of Substack posts, identify key patterns and immediately generate 10 viral post ideas. Each idea should include a catchy headline (using emojis, numbers, or questions) and a brief 2-3 sentence description with actionable hooks.

Analysis:
${cleanedAnalysis}

Output ONLY the 10 viral post ideas in a numbered list.`;
        console.log('Combined Viral Ideas Prompt:', combinedIdeasPrompt);
        const ideasResponse = await fetch('/api/groq/analyze-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: combinedIdeasPrompt, model: 'deepseek-r1-distill-llama-70b-specdec', temperature: 0.45 }),
        });
        if (!ideasResponse.ok) {
          const error = await ideasResponse.json();
          throw new Error(error.message || 'Failed to generate viral ideas');
        }
        const ideasData = await ideasResponse.json();
        ideasResult = ideasData.result.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
        console.log('Viral Ideas Result:', ideasResult);
      } else if (mode === 'notes') {
        console.log('Starting workflow with prompt for Notes...');
        console.log('Prompt:', prompt);
        console.log('Combined Promp V0: ', prompt+`After you've finished the analysis, generate 3 highly engaging viral notes that are punchy and impactful. Each note should have every sentence stand alone, creating rhythm and flow. No fluff—only actionable, real-talk style content that challenges assumptions.
Write using short & sweet sentences that trigger deep emotions. No sentence should exceed 20 words. 
Vary sentence length to create rhythm and flow. Maximize mobile readability.
Each sentence must be output on a new line. 
Start each note with a strong hook that grabs attention. What's a strong hook? It's creative. Outside the box. Eye-catching. It creates an emotion, a feeling. It makes people stop scrolling.

A great hook has maximum 10 words, always contains a number, an intriguing question, or a surprising statistic. 
Best if written from the perspective of the reader. 
The hook is always followed by a re-hook in the first sentence of the note.

It avoids jargon, fancy words, questions, emojis at all costs. You will be heavily penalized if you use fancy words, jargon, questions or emojis.

Ensure the tone is optimistic but grounded in reality—no empty inspiration, just real insights that resonate.

DO NOT OUTPUT THE ANALYSIS, PATTERNS, ETC

Output ONLY the 3 notes, separated by a clear delimiter: ###---###. No other text, explanations or info.

Think through this step by step`);
        // Build one combined prompt for both analysis and note generation.
        // This prompt exactly matches your requirements.
        const postsSection = posts.map(post => `${post.title}\n${post.excerpt}\n`).join('\n');
        console.log('Posts Section:', postsSection);
        const combinedNotesPrompt = `You are an expert content analyst and Substack content coach. I will provide you with a collection of Substack posts, where each post includes a headline and a 500‑character snippet. Your task is to analyze this collection and extract detailed patterns across the following dimensions:

Formatting:
How are the headlines structured (capitalization, punctuation, use of symbols, etc.)?
What is the layout of the snippets? (e.g., paragraph breaks, bullet points, emphasis on certain phrases)
Please extract all formatting patterns that contribute to making the winners win. 

Tone and Voice:
What overall tone do the posts convey (e.g., energetic, authoritative, conversational, humorous)?
What type of voice is used (first-person narrative, objective analysis, direct address to the reader)?

Style:
What are the common stylistic features? (e.g., use of rhetorical questions, metaphors, analogies, descriptive language, technical jargon)
Are there consistent language choices or sentence structures?

Topics and Themes:
What recurring subjects or topics do the posts cover (e.g., Bitcoin, economic cycles, market trends)?
Identify any common themes or ideas that appear across the posts.

Ideas and Concepts:
What innovative or recurring ideas are present? (e.g., predictions, strategies, risk management approaches, call-to-action elements)

Input (sorted in descending order by Total Engagement):
${postsSection}

After you've finished the analysis, generate 3 highly engaging viral notes that are punchy and impactful. Each note should have every sentence stand alone, creating rhythm and flow. No fluff—only actionable, real-talk style content that challenges assumptions.
Write using short & sweet sentences that trigger deep emotions. No sentence should exceed 20 words. 
Vary sentence length to create rhythm and flow. Maximize mobile readability.
Each sentence must be output on a new line. 
Start each note with a strong hook that grabs attention. What's a strong hook? It's creative. Outside the box. Eye-catching. It creates an emotion, a feeling. It makes people stop scrolling.

A great hook has maximum 10 words, always contains a number, an intriguing question, or a surprising statistic. 
Best if written from the perspective of the reader. 
The hook is always followed by a re-hook in the first sentence of the note.

It avoids jargon, fancy words, questions, emojis at all costs. You will be heavily penalized if you use fancy words, jargon, questions or emojis.

Ensure the tone is optimistic but grounded in reality—no empty inspiration, just real insights that resonate.

DO NOT OUTPUT THE ANALYSIS, PATTERNS, ETC

Output ONLY the 3 notes, separated by a clear delimiter: ###---###. No other text, explanations or info.

Think through this step by step.`;
        console.log('Combined 3 Notes Prompt:', combinedNotesPrompt);
        // Call the new TogetherAI backend endpoint with the combined prompt.
        const notesResponse = await fetch('/api/together/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemPrompt: "Act like a seasoned Substack creator who consistently goes viral with impactful notes.",
            userPrompt: combinedNotesPrompt,
            temperature: 1.24
          }),
        });
        if (!notesResponse.ok) {
          const error = await notesResponse.json();
          throw new Error(error.message || 'Failed to generate viral notes');
        }
        const notesData = await notesResponse.json();
        notesResult = notesData.result.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
        console.log('3 Notes Result:', notesResult);
      } else {
        // For mode 'post' or any other case, we simply use the analysis.
        console.log('Mode "post" selected, using only analysis.');
        const analysisResponse = await fetch('/api/groq/analyze-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, model: 'llama-3.3-70b-specdec', temperature: 0.62 }),
        });
        if (!analysisResponse.ok) {
          const error = await analysisResponse.json();
          throw new Error(error.message || 'Failed to analyze content');
        }
        const analysisData = await analysisResponse.json();
        cleanedAnalysis = analysisData.result.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      }
      
      return {
        analysis: cleanedAnalysis,
        ideas: ideasResult,
        notes: notesResult,
      };
    } catch (error) {
      console.error('Error analyzing content:', error);
      throw error;
    }
  };

  // Modified fetchTopPosts now accepts a mode parameter.
  const fetchTopPosts = async (mode: 'brainstorm' | 'notes' | 'post') => {
    try {
      setIsLoading(true);
      console.log('Starting to fetch posts from Substack...');
      console.log('Substack URL:', substackUrl);

      // Fetch posts from Substack – limit to 20 posts.
      const response = await fetch('/api/substack-pro/analyze-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: substackUrl.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch posts');
      }

      const data = await response.json();
      console.log('Fetched posts data:', data);

      // Process posts: take only the first 20.
      const processedPosts = data.posts.slice(0, 20).map((post: any) => ({
        title: post.title,
        excerpt: post.preview || '',
      }));
      console.log('Processed Posts (20):', processedPosts);
      setPosts(processedPosts);

      // Construct the analysis prompt using these posts.
      const prompt = constructPrompt(processedPosts);
      console.log('Analysis Prompt:', prompt);

      // Call analyzeWithGroq with the explicit mode parameter.
      console.log(`Starting analyzeWithGroq with mode: ${mode}`);
      const result = await analyzeWithGroq(prompt, mode);

      // Update state with the results.
      setResults(prevResults => ({
        ...prevResults,
        ...result
      }));

      // Deduct credits.
      if (credits === null) {
        toast.error("Credits information is missing. Please refresh the page.");
        return;
      }
      try {
        await updateCredits(credits - creditCost);
        console.log("Credits updated successfully");
      } catch (updateError) {
        console.error("Error updating credits:", updateError);
        toast.error("Failed to update credits. Please refresh the page.");
        return;
      }
      toast.success('Content analysis completed successfully!');
    } catch (error) {
      console.error('Error in fetchTopPosts:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze content');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Button handlers now call fetchTopPosts with an explicit mode.
  const handleBrainstorm = async () => {
    try {
      console.log('Brainstorm button clicked.');
      setActiveSection('brainstorm');
      await fetchTopPosts('brainstorm');
    } catch (error) {
      console.error('Brainstorm error:', error);
      setActiveSection(null);
    }
  };

  const handleGenerateNotes = async () => {
    try {
      console.log('3 Notes button clicked.');
      setActiveSection('notes');
      await fetchTopPosts('notes');
    } catch (error) {
      console.error('Generate notes error:', error);
      setActiveSection(null);
    }
  };

  useEffect(() => {
    const savedUrl = localStorage.getItem('substackUrl');
    if (savedUrl) {
      setSubstackUrl(savedUrl);
    }
  }, []);

  useEffect(() => {
    if (substackUrl) {
      localStorage.setItem('substackUrl', substackUrl);
    }
  }, [substackUrl]);

  // Helper function: returns the correct content based on activeSection.
  const getDisplayContent = () => {
    if (activeSection === 'brainstorm') {
      return results.ideas;
    } else if (activeSection === 'notes') {
      return results.notes;
    }
    return results.analysis;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-amber-600 hover:text-amber-500 flex items-center gap-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
            <h1 className="mt-4 text-3xl font-bold text-gray-900">The Home Run</h1>
            <p className="mt-2 text-gray-600">
              Generate viral content for your Substack with AI-powered brainstorming, notes, and posts.
            </p>
          </div>
        </div>

        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-8">
          <div className="mb-6 flex items-center justify-between bg-amber-50 p-4 rounded-lg">
            <span className="text-amber-700">Credits required: {creditCost}</span>
            <span className="font-medium text-amber-700">Your balance: {credits ?? 0}</span>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Substack URL
              </label>
              <Input
                type="url"
                value={substackUrl}
                onChange={(e) => setSubstackUrl(e.target.value)}
                placeholder="https://yourURL.substack.com"
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleBrainstorm}
                disabled={isLoading || !substackUrl}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
              >
                {isLoading && activeSection === 'brainstorm' ? 'Loading...' : 'Brainstorm'}
              </Button>

              <Button
                onClick={handleGenerateNotes}
                disabled={isLoading || !substackUrl}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700"
              >
                {isLoading && activeSection === 'notes' ? 'Loading...' : '3 Notes'}
              </Button>
            </div>

            {(results.ideas || results.analysis || results.notes) && (
              <div className="mt-8 space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {activeSection === 'brainstorm'
                    ? 'Viral Post Ideas'
                    : activeSection === 'notes'
                    ? '3 Viral Notes'
                    : 'Content Analysis Results'}
                </h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="whitespace-pre-wrap">
                    {getDisplayContent()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
