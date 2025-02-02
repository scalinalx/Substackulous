'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import type { SubstackAnalysis, SubstackOptimization, SubstackError } from '@/lib/types/substack';
import Image from 'next/image';

interface SubstackPost {
  title: string;
  likes: number;
  comments: number;
  restacks: number;
  thumbnail: string;
}

type SortBy = 'likes' | 'comments' | 'restacks';

export default function SubstackProContent() {
  const [mounted, setMounted] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();
  const [substackUrl, setSubstackUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<SubstackPost[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>('likes');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.replace('/');
    }
  }, [mounted, loading, user, router]);

  const handleAnalyzePosts = async () => {
    if (!substackUrl.trim() || isAnalyzing) return;
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/substack-pro/analyze-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: substackUrl }),
      });

      if (!response.ok) {
        const errorData: SubstackError = await response.json();
        throw new Error(errorData.message || 'Failed to analyze posts');
      }

      const data = await response.json();
      setPosts(data.posts);
    } catch (error) {
      console.error('Analysis error:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze posts');
      setPosts([]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeNotes = async () => {
    if (!substackUrl.trim() || isOptimizing) return;
    setIsOptimizing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/substack-pro/analyze-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: substackUrl }),
      });

      if (!response.ok) {
        const errorData: SubstackError = await response.json();
        throw new Error(errorData.message || 'Failed to analyze notes');
      }

      // Handle notes analysis response
    } catch (error) {
      console.error('Notes analysis error:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze notes');
    } finally {
      setIsOptimizing(false);
    }
  };

  const getSortedPosts = () => {
    return [...posts].sort((a, b) => b[sortBy] - a[sortBy]);
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-emerald-600 hover:text-emerald-500 flex items-center gap-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
            <h1 className="mt-4 text-3xl font-bold text-gray-900">Substack PRO</h1>
            <p className="mt-2 text-gray-600">
              Analyze and optimize your Substack newsletter for maximum growth and engagement
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
              <label htmlFor="substackUrl" className="block text-sm font-medium text-gray-700">
                Enter your Substack URL
              </label>
              <div className="flex gap-4">
                <Input
                  id="substackUrl"
                  type="url"
                  placeholder="https://yoursubstack.substack.com"
                  value={substackUrl}
                  onChange={(e) => setSubstackUrl(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleAnalyzePosts}
                disabled={!substackUrl.trim() || isAnalyzing}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
              >
                {isAnalyzing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing Posts...
                  </span>
                ) : 'Analyze Posts'}
              </Button>
              <Button
                onClick={handleAnalyzeNotes}
                disabled={!substackUrl.trim() || isOptimizing}
                className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-600 hover:to-emerald-600"
              >
                {isOptimizing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing Notes...
                  </span>
                ) : 'Analyze Notes'}
              </Button>
            </div>

            {posts.length > 0 && (
              <div className="mt-8 space-y-6">
                <div className="flex gap-4">
                  <Button
                    onClick={() => setSortBy('likes')}
                    variant={sortBy === 'likes' ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    Sort by Likes
                  </Button>
                  <Button
                    onClick={() => setSortBy('comments')}
                    variant={sortBy === 'comments' ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    Sort by Comments
                  </Button>
                  <Button
                    onClick={() => setSortBy('restacks')}
                    variant={sortBy === 'restacks' ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    Sort by Restacks
                  </Button>
                </div>

                <div className="space-y-4">
                  {getSortedPosts().map((post, index) => (
                    <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="relative w-24 h-24 flex-shrink-0">
                        <Image
                          src={post.thumbnail}
                          alt={post.title}
                          fill
                          className="object-cover rounded-md"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{post.title}</h3>
                        <div className="mt-2 flex gap-4 text-sm text-gray-600">
                          <span>👍 {post.likes} likes</span>
                          <span>💬 {post.comments} comments</span>
                          <span>🔄 {post.restacks} restacks</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-sm text-gray-500">
              <p>Enter your Substack URL to:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Analyze your newsletter&apos;s performance metrics</li>
                <li>Get insights on audience engagement</li>
                <li>Receive personalized optimization recommendations</li>
                <li>Identify growth opportunities</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 