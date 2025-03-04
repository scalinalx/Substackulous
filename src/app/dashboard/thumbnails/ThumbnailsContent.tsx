'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import ThumbnailGenerator from '@/app/components/ThumbnailGenerator';
import Link from 'next/link';

export default function ThumbnailsContent() {
  const [mounted, setMounted] = useState(false);
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !user) {
      router.replace('/');
    }
  }, [mounted, isLoading, user, router]);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

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
            <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">📸 Instant Post Image Generator</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Instantly create 3 eye-catching images for your post.
            </p>
            <p className="mt-2 text-gray-600">
            Your post deserves to stand out. Here you can automatically create 3 eye-catching, high-quality images for your Substack post in seconds—no design skills needed. Just enter your post details, and boom—you get scroll-stopping visuals that make your content look pro and increase engagement.
            </p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-700/50 sm:rounded-xl">
          <ThumbnailGenerator />
        </div>
      </div>
    </div>
  );
} 