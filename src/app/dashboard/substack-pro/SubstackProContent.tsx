'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';

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
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [substackUrl, setSubstackUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<SubstackPost[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>('total');
  const [analysisOutput, setAnalysisOutput] = useState<string>('');

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

  const handleAIAnalysis = () => {
    const sortedPosts = getSortedPosts();
    let output = '';
    
    sortedPosts.forEach((post, index) => {
      const totalEngagement = post.likes + post.comments + post.restacks;
      output += `Post ${index + 1}\n`;
      output += `${post.title}\n`;
      output += `${post.preview || 'No preview available'}\n`;
      output += `Likes: ${post.likes} Comments: ${post.comments} Restacks: ${post.restacks} Total Engagement: ${totalEngagement}\n`;
      output += '---\n\n';
    });

    setAnalysisOutput(output);
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-black hover:text-gray-700 flex items-center gap-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
            <h1 className="mt-4 text-3xl font-bold text-black">Substack PRO</h1>
            <p className="mt-2 text-black">
              Analyze your Substack newsletter for insights and optimization opportunities
            </p>
          </div>
        </div>

        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-8">
          <div className="max-w-3xl mx-auto space-y-8">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <label htmlFor="substackUrl" className="block text-sm font-medium text-black">
                Enter your Substack URL (e.g., https://yourblog.substack.com)
              </label>
              <div className="flex gap-4">
                <Input
                  id="substackUrl"
                  type="url"
                  placeholder="https://yourblog.substack.com"
                  value={substackUrl}
                  onChange={(e) => setSubstackUrl(e.target.value)}
                  disabled={isAnalyzing}
                  className="flex-1 bg-white text-black placeholder-gray-500 border-gray-300 focus:border-black focus:ring-black"
                />
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
              </div>
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

                  <div className="space-y-4">
                    {getSortedPosts().map((post, index) => (
                      <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
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
                            className="font-semibold text-black hover:text-emerald-600 transition-colors"
                          >
                            {post.title}
                          </a>
                          {post.preview && (
                            <p className="mt-2 text-sm text-black line-clamp-3">
                              {post.preview}
                            </p>
                          )}
                          <div className="mt-2 flex gap-4 text-sm text-black">
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
                                <path d="M21 3v5h-5M21 8l-3-2.7c-1.3-1.2-2.9-1.9-4.6-2.2-1.7-0.3-3.5-0.1-5.1 0.6-1.6 0.7-2.9 1.9-3.8 3.3C3.5 8.6 3 10.3 3 12m0 9v-5h5m-5-4l3 2.7c1.3 1.2 2.9 1.9 4.6 2.2 1.7 0.3 3.5 0.1 5.1-0.6 1.6-0.7 2.9-1.9 3.8-3.3 1-1.4 1.5-3.1 1.5-4.8" />
                              </svg>
                              {post.restacks}
                            </span>
                            <span className="flex items-center gap-1 text-emerald-600">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
                              </svg>
                              {post.likes + post.comments + post.restacks} total
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t">
                  <Button
                    onClick={handleAIAnalysis}
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700"
                  >
                    Find Patterns & Analyze with AI
                  </Button>

                  {analysisOutput && (
                    <div className="mt-6">
                      <Textarea
                        value={analysisOutput}
                        readOnly
                        className="w-full h-[500px] font-mono text-black bg-white border-gray-200 p-4"
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="text-sm text-black">
              <p>Enter your Substack URL to analyze your newsletter.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 