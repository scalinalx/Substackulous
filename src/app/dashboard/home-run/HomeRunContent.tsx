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
  // activeSection controls which additional API call to perform:
  // 'brainstorm' => viral ideas; 'notes' => 3 notes; 'post' => fallback to analysis.
  const [activeSection, setActiveSection] = useState<'brainstorm' | 'notes' | 'post' | null>(null);
  const creditCost = 3;

  // Constructs the analysis prompt using the posts data.
  // Now the prompt references only the first 20 posts.
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

  // This function performs the analysis API call and then conditionally calls a second API call
  // based on the mode parameter: 'brainstorm' calls viral ideas API; 'notes' calls the 3 notes API.
  const analyzeWithGroq = async (prompt: string, mode: 'brainstorm' | 'notes' | 'post'): Promise<AnalysisResults> => {
    try {
      console.log('Starting analysis API call with prompt...');
      // First API call: Get detailed content analysis.
      const analysisResponse = await fetch('/api/groq/analyze-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model: 'llama-3.3-70b-specdec', temperature: 0.62 }),
      });
      console.log('Analysis API call completed.');

      if (!analysisResponse.ok) {
        const error = await analysisResponse.json();
        throw new Error(error.message || 'Failed to analyze content');
      }
      const analysisData = await analysisResponse.json();
      const cleanedAnalysis = analysisData.result.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      console.log('Cleaned Analysis:', cleanedAnalysis);

      // Define variables for additional API responses.
      let ideasResult = '';
      let notesResult = '';

      if (mode === 'brainstorm') {
        // Construct and log the viral ideas prompt.
        const viralIdeasPrompt = `Act as an expert viral content strategist and creative writer for Substack. You will work solely from the structured analysis provided below, which outlines a successful content creator's formatting, tone, voice, style, topics, themes, and recurring ideas. 

Based on this analysis, please first determine:
1. The most appropriate FIELD/INDUSTRY that the content belongs to.
2. The TARGET AUDIENCE that the content is meant to engage.

Note: Use your best inference based on the analysis context if these details are not explicitly mentioned.

The CONTENT STRATEGY GOAL is fixed: to establish your presence on Substack, grow your Substack audience, engage & connect with your community, and maximize your conversion rate from free subscribers to paid.

Using the above context and your inferred FIELD/INDUSTRY and TARGET AUDIENCE, generate **10 viral post ideas** for Substack. For each idea, provide:

1. **A catchy headline:** Use attention-grabbing elements such as emojis, numbers, or rhetorical questions, in line with the analysis.
2. **A brief concept description (2–3 sentences):** Outline the post's content, structure, and key engagement hooks, explaining how it aligns with the style, tone, and themes from the analysis.

Below is the structured analysis context:

${cleanedAnalysis}

Output ONLY the 10 viral ideas. Do not output any additional explanation. Please work through this task step-by-step, first identifying the FIELD/INDUSTRY and TARGET AUDIENCE from the analysis, and then provide your list of 10 viral post ideas.`;
        console.log('Viral Ideas Prompt:', viralIdeasPrompt);
        const ideasResponse = await fetch('/api/groq/analyze-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: viralIdeasPrompt, model: 'llama-3.3-70b-specdec', temperature: 0.62 }),
        });
        if (!ideasResponse.ok) {
          const error = await ideasResponse.json();
          throw new Error(error.message || 'Failed to generate viral ideas');
        }
        const ideasData = await ideasResponse.json();
        ideasResult = ideasData.result.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
        console.log('Viral Ideas Result:', ideasResult);
      } else if (mode === 'notes') {
        // Construct and log the 3 notes prompt.
        const notes3Prompt = ` Act like a seasoned Substack creator who consistently goes viral with impactful notes.
        
        ${cleanedAnalysis}
        
Write 3 highly engaging notes designed to go viral based on the analysis above. Keep them punchy and impactful. Every sentence should stand on its own, creating rhythm and flow. No fluff, no wasted words.

The notes should challenge assumptions, reframe ideas, or create a sense of urgency. They should feel like real talk—natural, conversational, and sharp, without being overly motivational. Focus on clarity and insight, avoiding jargon while still sounding intelligent.

Tailor the notes to the themes, topics, and target audience derived from the analysis above, while maintaining a focus on progress and action.

Output ONLY the 3 notes. Do not output any additional explanation.`;
        console.log('3 Notes Prompt:', notes3Prompt);
        const notesResponse = await fetch('/api/groq/analyze-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: notes3Prompt, model: 'llama-3.3-70b-specdec', temperature: 0.62 }),
        });
        if (!notesResponse.ok) {
          const error = await notesResponse.json();
          throw new Error(error.message || 'Failed to generate viral notes');
        }
        const notesData = await notesResponse.json();
        notesResult = notesData.result.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
        console.log('3 Notes Result:', notesResult);
      }
      
      // For mode 'post' or other modes, simply use the analysis.
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

  const fetchTopPosts = async () => {
    try {
      setIsLoading(true);
      console.log('Starting to fetch posts from Substack...');

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

      // Construct the analysis prompt from posts.
      const prompt = constructPrompt(processedPosts);
      console.log('Analysis Prompt:', prompt);

      // Call the analysis function, passing the activeSection as the mode.
      console.log(`Starting analyzeWithGroq with mode: ${activeSection}`);
      const result = await analyzeWithGroq(prompt, activeSection ?? 'post');

      // Update results state with analysis, viral ideas, and/or notes.
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

  // Button handlers set the activeSection (mode) and then call fetchTopPosts.
  const handleBrainstorm = async () => {
    try {
      console.log('Brainstorm button clicked.');
      setActiveSection('brainstorm');
      await fetchTopPosts();
    } catch (error) {
      console.error('Brainstorm error:', error);
      setActiveSection(null);
    }
  };

  const handleGenerateNotes = async () => {
    try {
      console.log('3 Notes button clicked.');
      setActiveSection('notes');
      await fetchTopPosts();
    } catch (error) {
      console.error('Generate notes error:', error);
      setActiveSection(null);
    }
  };

  const handleGeneratePost = async () => {
    try {
      console.log('1 Post button clicked.');
      setActiveSection('post');
      await fetchTopPosts();
    } catch (error) {
      console.error('Generate post error:', error);
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

  // Helper function: return the correct output based on activeSection.
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <Button
                onClick={handleGeneratePost}
                disabled={isLoading || !substackUrl}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700"
              >
                {isLoading && activeSection === 'post' ? 'Loading...' : '1 Post'}
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
