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
  const [activeSection, setActiveSection] = useState<'brainstorm' | 'notes' | 'post' | null>(null);

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
        excerpt: post.body.substring(0, 500) + '...',
      }));

      setPosts(processedPosts);
      toast.success('Posts fetched successfully!');
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
                placeholder="https://yourname.substack.com"
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
            {posts.length > 0 && (
              <div className="mt-8 space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {activeSection === 'brainstorm' && 'Brainstorming Based on Your Top Posts'}
                  {activeSection === 'notes' && 'Analyzing Posts for Note Generation'}
                  {activeSection === 'post' && 'Analyzing Posts for Content Creation'}
                </h2>
                <div className="space-y-4">
                  {posts.map((post, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">{post.title}</h3>
                      <p className="text-gray-600 text-sm">{post.excerpt}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 