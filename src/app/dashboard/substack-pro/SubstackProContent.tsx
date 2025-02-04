'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import Image from 'next/image';

interface SubstackPost {
  title: string;
  likes: number;
  comments: number;
  restacks: number;
  thumbnail: string;
  url: string;
}

type SortBy = 'likes' | 'comments' | 'restacks';

const TIMEOUT_DURATION = 300000; // 5 minutes
const MAX_RETRIES = 3;
const POLL_INTERVAL = 5000; // Poll every 5 seconds
const MAX_POLL_TIME = 300000; // Stop polling after 5 minutes

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = TIMEOUT_DURATION) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export default function SubstackProContent() {
  const [mounted, setMounted] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();
  const [substackUrl, setSubstackUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crawlResponse, setCrawlResponse] = useState<any>(null);
  const [progress, setProgress] = useState<string>('');
  const [crawlId, setCrawlId] = useState<string | null>(null);
  const [pollStartTime, setPollStartTime] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.replace('/');
    }
  }, [mounted, loading, user, router]);

  // Poll for crawl status
  useEffect(() => {
    if (!crawlId || !isAnalyzing || !pollStartTime) return;

    // Stop polling if we've exceeded the maximum time
    if (Date.now() - pollStartTime > MAX_POLL_TIME) {
      setError('Analysis timed out after 5 minutes. Please try again.');
      setIsAnalyzing(false);
      setCrawlId(null);
      setPollStartTime(null);
      return;
    }

    const pollStatus = async () => {
      try {
        const response = await fetch('/api/substack-pro/analyze-posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ crawlId }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to check status');
        }

        if (data.type === 'status') {
          const status = data.status;
          console.log('Received status:', status);
          
          if (status.status === 'completed') {
            setCrawlResponse(status.data);
            setProgress('');
            setIsAnalyzing(false);
            setCrawlId(null);
            setPollStartTime(null);
          } else if (status.status === 'failed') {
            throw new Error(status.error || 'Crawl failed');
          } else {
            setProgress(`Crawling in progress... Status: ${status.status}`);
          }
        }
      } catch (err) {
        console.error('Status check error:', err);
        setError(err instanceof Error ? err.message : 'Failed to check status');
        setProgress('');
        setIsAnalyzing(false);
        setCrawlId(null);
        setPollStartTime(null);
      }
    };

    const intervalId = setInterval(pollStatus, POLL_INTERVAL);
    return () => clearInterval(intervalId);
  }, [crawlId, isAnalyzing, pollStartTime]);

  const handleAnalyzePosts = async () => {
    if (!substackUrl.trim() || isAnalyzing) return;
    setIsAnalyzing(true);
    setError(null);
    setCrawlResponse(null);
    setCrawlId(null);
    setPollStartTime(null);
    setProgress('Starting analysis...');
    
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
        throw new Error(data.error || 'Failed to start analysis');
      }

      if (data.type === 'start' && data.crawlId) {
        console.log('Started crawl with ID:', data.crawlId);
        setCrawlId(data.crawlId);
        setPollStartTime(Date.now());
        setProgress('Crawl started, waiting for results...');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze');
      setProgress('');
      setIsAnalyzing(false);
    }
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

            {progress && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">{progress}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <label htmlFor="substackUrl" className="block text-sm font-medium text-gray-700">
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
                  className="flex-1"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleAnalyzePosts}
                disabled={isAnalyzing || !substackUrl.trim()}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
              >
                {isAnalyzing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  'Analyze'
                )}
              </Button>
            </div>

            {crawlResponse && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Crawl Response:</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm font-mono overflow-auto max-h-[500px]">
                    {JSON.stringify(crawlResponse, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <div className="text-sm text-gray-500">
              <p>Enter your Substack URL to analyze your newsletter.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 