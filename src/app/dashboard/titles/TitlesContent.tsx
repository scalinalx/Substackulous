'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Import Link
import { darkModeClasses } from '@/lib/utils/darkModeClasses';

export default function TitleGenerator() {
    const router = useRouter();
    const { user, profile, updateCredits, session, credits, recordUsage } = useAuth(); // Use updateCredits and credits
    const [loading, setLoading] = useState(false);
    const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);
    const [topic, setTopic] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);
    const creditCost = 1;
    const titlesRef = useRef<string[] | null>(null); // Ref to store titles temporarily


    const isMounted = useRef(true);

    useEffect(() => {
        console.log("TitleGenerator mounted");
        isMounted.current = true;
        return () => {
            console.log("TitleGenerator unmounting");
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        setMounted(true);
    }, []);


    const copyToClipboard = async (text: string, index: number) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

  const handleGenerateTitles = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setGeneratedTitles([]);

        if (!topic.trim()) {
            setError('Please enter a topic');
            return;
        }

        if (!session?.access_token) {
            setError('No valid session. Please sign in again.');
            return;
        }

        if (!user || !profile) {
            setError('Please sign in to continue');
            return;
        }

        if (credits === null || credits < creditCost) {
            setError(`Not enough credits. You need ${creditCost} credits to generate titles.`);
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/deepseek/generate-titles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    theme: topic,
                    userId: user.id
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to generate titles: ${response.status}`);
            }

            const responseData = await response.json();
            if (!responseData.titles || !Array.isArray(responseData.titles)) {
                throw new Error('Invalid response format');
            }

            console.log("Raw titles received:", responseData.titles);

            const cleanedTitles = responseData.titles.map((title: string) =>
                title.replace(/^"|"$/g, '').replace(/\\"/g, '"')
            );

            titlesRef.current = cleanedTitles;
            console.log("Titles stored in ref:", titlesRef.current);

            // Update credits without affecting the global loading state
            try {
                await updateCredits(credits - creditCost);
                console.log("Credits updated");
                
                // Record usage history
                try {
                    const actionDescription = `Generated ${cleanedTitles.length} title ideas for topic: ${topic}`;
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
            } catch (updateError) {
                console.error("Error updating credits:", updateError);
                setError("Failed to update credits. Please refresh the page.");
                return;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate titles. Please try again.');
            setGeneratedTitles([]);
            return;
        } finally {
            setLoading(false);
            console.log("Titles generation complete");
            if (titlesRef.current && isMounted.current) {
                console.log("Setting generatedTitles from ref:", titlesRef.current);
                setGeneratedTitles(titlesRef.current);
                titlesRef.current = null;
            }
        }
    }, [topic, session, user, profile, creditCost, updateCredits, credits, recordUsage]);


  const TitleItem = ({ title, index }: { title: string; index: number }) => {
    useEffect(() => {
      console.log("Rendering title:", title, index);

      return () => {
        console.log("TitleItem UNMOUNTING:", title, index);
      };
    }, [title, index]);
      console.log("TitleItem rendering:", title, index);

    return (
      <div
        key={`title-${index}`}
        className="group flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-amber-200 dark:hover:border-amber-700 transition-colors"
      >
        <span className="flex-none w-8 text-gray-400 dark:text-gray-500 text-sm">
          {index + 1}.
        </span>
        <div className="flex-1 text-gray-900 dark:text-white">
          {title}
        </div>
        <button
          type="button"
          onClick={() => copyToClipboard(title, index)}
          className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-500 focus:outline-none focus:text-amber-600 dark:focus:text-amber-500 transition-colors opacity-0 group-hover:opacity-100"
        >
          {copiedIndex === index ? (
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </span>
          ) : (
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy
            </span>
          )}
        </button>
      </div>
    );
  };

    if (!mounted) {
        return null;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
            <div>
            <Link
                href="/dashboard"
                className={darkModeClasses.backLink}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
            </Link>
            <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">🔥 Click-Worthy Title Maker</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
                Turn any idea into a scroll-stopping, must-click headlines that grab attention.
            </p>
            </div>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-700/50 sm:rounded-xl p-8">
            <div className="mb-6 flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
            <span className="text-amber-700 dark:text-amber-400">Credits required: {creditCost}</span>
            <span className="font-medium text-amber-700 dark:text-amber-400">Your balance: {credits ?? 0}</span>
            </div>
            {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-600 p-4">
                <div className="flex">
                <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400 dark:text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="ml-3">
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
                </div>
            </div>
            )}
            <form onSubmit={handleGenerateTitles} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Topic <span className="text-red-500">*</span>
                </label>
                <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Brief description of your post's topic..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                rows={2}
                required
                disabled={loading}
                />
            </div>
            <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-md hover:from-amber-600 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                {loading ? (
                <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                </span>
                ) : "Generate Titles"}
            </button>
            </form>

            {generatedTitles.length > 0 && (
            <div className="mt-8 space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Generated Titles</h2>
                <div className="space-y-2">
                {generatedTitles.map((title, index) => (
                    <TitleItem key={index} title={title} index={index} />
                ))}
                </div>
            </div>
            )}
        </div>
        </div>
    );
}