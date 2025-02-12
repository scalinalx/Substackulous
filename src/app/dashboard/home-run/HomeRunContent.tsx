'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { toast } from 'sonner';

interface Post {
  title: string;
  excerpt: string;
}

export default function HomeRunContent() {
  const { user, profile } = useAuth();
  const [substackUrl, setSubstackUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [constructedPrompt, setConstructedPrompt] = useState<string>('');
  const [activeSection, setActiveSection] = useState<'brainstorm' | 'notes' | 'post' | null>(null);

  const constructPrompt = (posts: Post[]) => {
    const postsSection = posts.map(post => (
      `Title: ${post.title}\nExcerpt: ${post.excerpt}\n`
    )).join('\n');

    return `You are an expert content analyst and Substack content coach. I will provide you with a collection of Substack posts, where each post includes a headline and a 500‑character snippet. Your task is to analyze this collection and extract detailed patterns across the following dimensions:

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

After you extract and list the patterns in each of these categories, please provide a structured summary that:
1. Describes the overall style, tone, and voice of the content creator.
2. Highlights the key topics and themes.

Input (sorted in descending order by Total Engagement):

${postsSection}

Provide your answer in a structured format with clear headings for each category (Formatting, Tone and Voice, Style, Topics and Themes, Ideas).

Be as detailed as possible. Focus on highlighting what makes winners win. 
Think through this step by step.`;
  };

  const fetchTopPosts = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/substack-pro/analyze-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: substackUrl.trim()
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch posts');
      }

      const data = await response.json();
      
      // Process the posts to get title and first 500 characters
      const processedPosts = data.posts.slice(0, 50).map((post: any) => ({
        title: post.title,
        excerpt: post.preview || '',
      }));

      setPosts(processedPosts);
      
      // Construct and set the prompt
      const prompt = constructPrompt(processedPosts);
      setConstructedPrompt(prompt);
      
      toast.success('Analysis prompt generated successfully!');
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch posts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBrainstorm = async () => {
    setActiveSection('brainstorm');
    await fetchTopPosts();
  };

  const handleGenerateNotes = async () => {
    setActiveSection('notes');
    await fetchTopPosts();
  };

  const handleGeneratePost = async () => {
    setActiveSection('post');
    await fetchTopPosts();
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
            <span className="text-amber-700">Credits required: 1-3</span>
            <span className="font-medium text-amber-700">Your balance: {profile?.credits ?? 0}</span>
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

            {/* Results Section */}
            {constructedPrompt && (
              <div className="mt-8 space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {activeSection === 'brainstorm' && 'Content Analysis Prompt for Brainstorming'}
                  {activeSection === 'notes' && 'Content Analysis Prompt for Note Generation'}
                  {activeSection === 'post' && 'Content Analysis Prompt for Post Creation'}
                </h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 overflow-x-auto">
                    {constructedPrompt}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 