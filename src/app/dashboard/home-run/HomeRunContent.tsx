'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';

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
  const [parsedNotes, setParsedNotes] = useState<string[]>([]);
  const [parsedIdeas, setParsedIdeas] = useState<string[]>([]);
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
          const errorText = await analysisResponse.text();
          console.error('Analysis API error response:', errorText);
          try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.message || 'Failed to analyze content');
          } catch (parseError) {
            throw new Error(`Failed to analyze content: ${errorText.substring(0, 100)}`);
          }
        }
        
        // Safely parse the response
        let analysisData;
        try {
          const responseText = await analysisResponse.text();
          console.log('Raw analysis response:', responseText.substring(0, 100) + '...');
          analysisData = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Error parsing analysis response:', parseError);
          throw new Error('Failed to parse analysis response');
        }
        
        cleanedAnalysis = analysisData.result.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
        console.log('Cleaned Analysis (Brainstorm):', cleanedAnalysis);

        // Build combined prompt for viral ideas.
        const combinedIdeasPrompt = `Based on the following analysis of Substack posts, identify key patterns and immediately generate 10 viral post ideas. Each idea should include a catchy headline (using emojis, numbers, or questions) and a brief 2-3 sentence description with actionable hooks.

Analysis:
${cleanedAnalysis}

Output ONLY the 10 viral post ideas in a numbered list.`;
        console.log('Combined Viral Ideas Prompt:', combinedIdeasPrompt);
        
        // Use the same endpoint that works for notes
        const ideasResponse = await fetch('/api/together/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemPrompt: "Act like a seasoned Substack creator who consistently goes viral with engaging post ideas.",
            userPrompt: combinedIdeasPrompt,
            temperature: 0.8
          }),
        });
        
        if (!ideasResponse.ok) {
          const errorText = await ideasResponse.text();
          console.error('Ideas API error response:', errorText);
          try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.message || 'Failed to generate viral ideas');
          } catch (parseError) {
            throw new Error(`Failed to generate viral ideas: ${errorText.substring(0, 100)}`);
          }
        }
        
        // Safely parse the response
        let ideasData;
        try {
          const responseText = await ideasResponse.text();
          console.log('Raw ideas response:', responseText.substring(0, 100) + '...');
          ideasData = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Error parsing ideas response:', parseError);
          throw new Error('Failed to parse ideas response');
        }
        
        ideasResult = ideasData.result.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
        console.log('Viral Ideas Result:', ideasResult);
      } else if (mode === 'notes') {
        console.log('Starting workflow with prompt for Notes...');
        const cv0 = prompt+`After you've finished the analysis, generate 3 highly engaging viral notes that are punchy and impactful. Each note should have every sentence stand alone, creating rhythm and flow. No fluff—only actionable, real-talk style content that challenges assumptions.
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
        
        Think through this step by step.`
        const withoutFirst = cv0.replace(
          /Provide your answer in a structured format with clear headings for each category \(Formatting, Tone and Voice, Style, Topics and Themes, Ideas\)\.\s*Be as detailed as possible\. Focus on highlighting what makes winners win\.\s*Think through this step by step\./,
          ''
        );
        
        // Remove the second unwanted phrase.
        const cleanedCv0 = withoutFirst.replace(
          /After you extract and list the patterns in each of these categories, please provide a detailed, comprehensive, insightful and nuanced structured summary that:\s*1\. Describes the overall style, tone, and voice of the content creator\.\s*2\. Highlights the key topics and themes\./,
          ''
        );
        
        // console.log(cleanedCv0);
        // Build one combined prompt for both analysis and note generation.
        // This prompt exactly matches your requirements.
        const postsSection = posts.map(post => `${post.title}\n${post.excerpt}\n`).join('\n');
        const combinedNotesPrompt = cleanedCv0 ;
        console.log('Combined & CLEANED 3 Notes Prompt:', combinedNotesPrompt);
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

  // Parse notes when they are received
  useEffect(() => {
    if (results.notes) {
      // Split notes by the delimiter
      const notes = results.notes.split('###---###').map(note => note.trim()).filter(note => note);
      setParsedNotes(notes);
    }
  }, [results.notes]);

  // Parse ideas when they are received
  useEffect(() => {
    if (results.ideas) {
      // Split ideas by numbered list (1., 2., etc.)
      const ideas = results.ideas.split(/\d+\./).map(idea => idea.trim()).filter(idea => idea);
      setParsedIdeas(ideas);
    }
  }, [results.ideas]);

  // Modified fetchTopPosts now accepts a mode parameter.
  const fetchTopPosts = async (mode: 'brainstorm' | 'notes' | 'post') => {
    try {
      setIsLoading(true);
      setActiveSection(mode);
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

  const handleBrainstorm = async () => {
    try {
      console.log('Brainstorm button clicked.');
      await fetchTopPosts('brainstorm');
    } catch (error) {
      console.error('Brainstorm error:', error);
      setActiveSection(null);
    }
  };

  const handleGenerateNotes = async () => {
    try {
      console.log('3 Notes button clicked.');
      await fetchTopPosts('notes');
    } catch (error) {
      console.error('Generate notes error:', error);
      setActiveSection(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast.success('Copied to clipboard!');
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
        toast.error('Failed to copy to clipboard');
      });
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/dashboard"
              className="text-amber-600 hover:text-amber-500 dark:text-amber-500 dark:hover:text-amber-400 flex items-center gap-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
            <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">The Home Run</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Analyze any Substack, and get in seconds viral post titles, and high-engagement viral notes.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Analyze a Substack</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow">
              <Input
                type="text"
                placeholder="Enter Substack URL (e.g., https://example.substack.com)"
                value={substackUrl}
                onChange={(e) => setSubstackUrl(e.target.value)}
                className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleBrainstorm}
                disabled={isLoading || !substackUrl || (credits ?? 0) < creditCost}
                className="whitespace-nowrap"
              >
                {isLoading && activeSection === 'brainstorm' ? 'Analyzing...' : 'Brainstorm Ideas'}
              </Button>
              <Button
                onClick={handleGenerateNotes}
                disabled={isLoading || !substackUrl || (credits ?? 0) < creditCost}
                className="whitespace-nowrap"
              >
                {isLoading && activeSection === 'notes' ? 'Analyzing...' : 'Generate Notes'}
              </Button>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Cost: {creditCost} credits. You have {credits ?? 0} credits remaining.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-700/50 sm:rounded-xl p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">Analyzing Substack content...</p>
            </div>
          ) : posts.length > 0 ? (
            <div>
              {activeSection === 'notes' && parsedNotes.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Generated Viral Notes</h2>
                  <div className="space-y-8">
                    {parsedNotes.map((note, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg relative">
                        <button 
                          onClick={() => copyToClipboard(note)}
                          className="absolute top-3 right-3 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          aria-label="Copy to clipboard"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <div className="whitespace-pre-line">
                          {note.split('\n').map((line, lineIndex) => (
                            <p 
                              key={lineIndex} 
                              className={`mb-2 ${lineIndex === 0 ? 'text-lg font-bold' : ''}`}
                            >
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === 'brainstorm' && parsedIdeas.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Viral Post Ideas</h2>
                  <div className="space-y-4">
                    {parsedIdeas.map((idea, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg relative">
                        <button 
                          onClick={() => copyToClipboard(idea)}
                          className="absolute top-3 right-3 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          aria-label="Copy to clipboard"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <div className="whitespace-pre-line">
                          <p className="font-bold mb-2">{index + 1}. {idea.split('\n')[0]}</p>
                          <p>{idea.split('\n').slice(1).join('\n')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!parsedNotes.length && !parsedIdeas.length && (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-300">
                    Click &quot;Brainstorm Ideas&quot; or &quot;Generate Notes&quot; to get started.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-300">
                Enter a Substack URL above to analyze content and generate ideas.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
