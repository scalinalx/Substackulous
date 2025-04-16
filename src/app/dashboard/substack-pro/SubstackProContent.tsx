'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';

interface SubstackPost {
  title: string;
  likes: number;
  comments: number;
  restacks: number;
  thumbnail: string;
  url: string;
  preview?: string;
}

type SortBy = 'likes' | 'comments' | 'restacks' | 'total';

export default function SubstackProContent() {
  const { user, isLoading: authLoading, credits, updateCredits, recordUsage } = useAuth();
  const router = useRouter();
  const [substackUrl, setSubstackUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingWithGroq, setIsAnalyzingWithGroq] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<SubstackPost[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>('total');
  const [analysisOutput, setAnalysisOutput] = useState<string>('');
  const creditCost = 2;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    router.replace('/');
    return null;
  }

  const handleAnalyzePosts = async () => {
    if (!substackUrl.trim() || isAnalyzing) return;
    
    setIsAnalyzing(true);
    setError(null);
    setPosts([]);
    setAnalysisOutput('');
    
    try {
      // Check if user has enough credits
      if (credits === null) {
        toast.error("Credits information is missing. Please refresh the page.");
        return;
      }
      
      if (credits < creditCost) {
        toast.error(`Not enough credits. You need ${creditCost} credit to use this feature.`);
        return;
      }
      
      const response = await fetch('/api/substack-pro/analyze-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: substackUrl.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze');
      }

      if (data.logs) {
        console.log('API Logs:', data.logs);
      }

      setPosts(data.posts || []);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAIAnalysis = async () => {
    if (isAnalyzingWithGroq || posts.length === 0) return;
    
    setIsAnalyzingWithGroq(true);
    setError(null);
    
    try {
      // Check if user has enough credits
      if (credits === null) {
        toast.error("Credits information is missing. Please refresh the page.");
        return;
      }
      
      if (credits < creditCost) {
        toast.error(`Not enough credits. You need ${creditCost} credit to use this feature.`);
        return;
      }

      // Construct a detailed prompt for post analysis
      console.log('Number of posts before analysis:', posts.length, posts);
      
      // Take only top 20 posts by total engagement
      const top20posts = [...posts]
        .sort((a, b) => ((b.likes + b.comments + b.restacks) - (a.likes + a.comments + a.restacks)))
        .slice(0, 20);
      
      console.log('Number of posts after slicing to top 20:', top20posts.length);
      
      const postsForAnalysis = top20posts.map(post => ({
        title: post.title,
        preview: post.preview || 'No preview available',
        engagement: post.likes + post.comments + post.restacks
      }));

      const prompt = `I will provide you with a collection of Substack posts, sorted by total engagement. Each post includes a title, preview content, and engagement metrics. Your task is to analyze this collection and extract detailed patterns across the following dimensions:

1. Content Strategy:
- What types of content perform best?
- What patterns emerge in the high-performing posts vs lower-performing ones?
- What unique angles or approaches are used in the most successful posts?

2. Title Analysis:
- What patterns appear in the most engaging titles?
- What structures, formats, or trigger words are used effectively?
- How do the best-performing titles differ from others?

3. Writing Style:
- What writing techniques are most effective?
- How is the content structured in successful posts?
- What tone and voice characteristics stand out?

4. Engagement Patterns:
- What content types drive more likes vs. comments vs. restacks?
- Are there specific topics or approaches that consistently generate higher engagement?
- What patterns emerge in the preview text of highly-engaged posts?

5. Actionable Recommendations:
- What specific strategies should be adopted based on this analysis?
- What content types should be prioritized?
- What writing techniques should be emphasized?

Posts for Analysis (sorted by total engagement):

${JSON.stringify(postsForAnalysis, null, 2)}

Please provide a detailed, data-driven analysis with specific examples from the posts. Focus on actionable insights that can be immediately implemented to improve content performance.

Format your response in clear sections with markdown headings and bullet points for better readability. Include specific examples from the analyzed posts to support your findings.`;

      console.log('Prompt:', prompt);
      
      const response = await fetch('/api/together/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemPrompt: "Act like a seasoned content analyst and Substack content coach who provides detailed, structured analysis with actionable insights.",
          userPrompt: prompt,
          temperature: 0.8
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze with AI');
      }

      const data = await response.json();
      setAnalysisOutput(data.result);
      
      // Deduct credits after successful analysis
      try {
        await updateCredits(credits - creditCost);
        
        // Record usage with Substack URL information
        try {
          const actionDescription = `Used Substack Growth Engine to analyze ${substackUrl}`;
          const recordResult = await recordUsage(actionDescription, creditCost);
          
          if (!recordResult.success) {
            console.error("Failed to record usage:", recordResult.error);
            // Don't block the main flow, just log the error
          } else {
            console.log("Usage recorded successfully");
          }
        } catch (recordError) {
          console.error("Exception recording usage:", recordError);
          // Don't block the main flow, just log the error
        }
        
        toast.success('Analysis completed successfully!');
      } catch (updateError) {
        console.error("Error updating credits:", updateError);
        toast.error("Failed to update credits. Please refresh the page.");
      }
    } catch (err) {
      console.error('AI Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze with AI');
    } finally {
      setIsAnalyzingWithGroq(false);
    }
  };

  const getSortedPosts = () => {
    return [...posts].sort((a, b) => {
      if (sortBy === 'total') {
        return (b.likes + b.comments + b.restacks) - (a.likes + a.comments + a.restacks);
      }
      return b[sortBy] - a[sortBy];
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-black hover:text-gray-700 dark:text-white dark:hover:text-gray-300 flex items-center gap-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
            <h1 className="mt-4 text-3xl font-bold text-black dark:text-white">🚀 The Substack Growth Engine</h1>
            <p className="mt-2 text-black dark:text-gray-300">
              Analyze any Substack and get data-driven growth tips, find patterns behind the winners and single out the trends you need to double down on — just paste a link.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-700/50 sm:rounded-xl md:col-span-2">
          <div className="px-4 py-6 sm:p-8">
            <div className="flex flex-col space-y-6">
              <div>
                <label htmlFor="substackUrl" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">
                  Substack URL
                </label>
                <div className="mt-2">
                  <Input
                    type="text"
                    name="substackUrl"
                    id="substackUrl"
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                    placeholder="https://example.substack.com"
                    value={substackUrl}
                    onChange={(e) => setSubstackUrl(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={handleAnalyzePosts}
                  disabled={isAnalyzing || !substackUrl.trim()}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 disabled:from-gray-400 disabled:to-gray-400"
                >
                  {isAnalyzing ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing Posts...
                    </span>
                  ) : (
                    'Analyze Posts'
                  )}
                </Button>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Cost: {creditCost} credit. You have {credits ?? 0} credits remaining.
                </p>
              </div>

              {posts.length > 0 && (
                <>
                  <div className="mt-8 space-y-6">
                    <div className="flex gap-4">
                      <Button
                        onClick={() => setSortBy('total')}
                        variant="outline"
                        className={`flex-1 ${sortBy === 'total' ? 'bg-emerald-600 text-white' : 'text-emerald-600 hover:text-emerald-700'}`}
                      >
                        Sort by Total Engagement
                      </Button>
                      <Button
                        onClick={() => setSortBy('likes')}
                        variant="outline"
                        className={`flex-1 ${sortBy === 'likes' ? 'bg-emerald-600 text-white' : 'text-emerald-600 hover:text-emerald-700'}`}
                      >
                        Sort by Likes
                      </Button>
                      <Button
                        onClick={() => setSortBy('comments')}
                        variant="outline"
                        className={`flex-1 ${sortBy === 'comments' ? 'bg-emerald-600 text-white' : 'text-emerald-600 hover:text-emerald-700'}`}
                      >
                        Sort by Comments
                      </Button>
                      <Button
                        onClick={() => setSortBy('restacks')}
                        variant="outline"
                        className={`flex-1 ${sortBy === 'restacks' ? 'bg-emerald-600 text-white' : 'text-emerald-600 hover:text-emerald-700'}`}
                      >
                        Sort by Restacks
                      </Button>
                    </div>

                    <Button
                      onClick={handleAIAnalysis}
                      disabled={isAnalyzingWithGroq}
                      className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 disabled:from-gray-400 disabled:to-gray-400"
                    >
                      {isAnalyzingWithGroq ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Finding Patterns & Analyzing with AI...
                        </span>
                      ) : (
                        'Find Patterns & Analyze with AI'
                      )}
                    </Button>

                    {analysisOutput && (
                      <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg prose prose-emerald dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {analysisOutput}
                        </ReactMarkdown>
                      </div>
                    )}

                    <div className="space-y-4">
                      {getSortedPosts().map((post, index) => (
                        <div key={index} className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                          {post.thumbnail && (
                            <div className="relative w-24 h-24 flex-shrink-0">
                              <Image
                                src={post.thumbnail}
                                alt={post.title}
                                fill
                                className="object-cover rounded-md"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <a 
                              href={post.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-lg font-medium text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400"
                            >
                              {post.title}
                            </a>
                            {post.preview && (
                              <p className="mt-2 text-sm text-black line-clamp-3">
                                {post.preview}
                              </p>
                            )}
                            <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                                </svg>
                                {post.likes}
                              </span>
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                                </svg>
                                {post.comments}
                              </span>
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M17 1l4 4-4 4" />
                                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                                  <path d="M7 23l-4-4 4-4" />
                                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                                </svg>
                                {post.restacks}
                              </span>
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M12 20V10" />
                                  <path d="M18 20V4" />
                                  <path d="M6 20v-4" />
                                </svg>
                                {post.likes + post.comments + post.restacks}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 