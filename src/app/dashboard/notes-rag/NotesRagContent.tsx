'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { toast } from 'sonner';

type GeneratedResult = {
  llama: {
    shortNotes: string[];
    longFormNote: string;
  };
  openai: {
    shortNotes: string[];
    longFormNote: string;
  };
};

export default function NotesRagContent() {
  const router = useRouter();
  const { user, profile, updateProfile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const creditCost = 1;

  // Handle profile updates separately
  const [localProfile, setLocalProfile] = useState(profile);
  
  useEffect(() => {
    console.log('Profile updated:', profile);
    setLocalProfile(profile);
  }, [profile]);

  // Auth check - only return null if we're definitely not authenticated
  if (!user) {
    console.log('No user found, returning null');
    return null;
  }

  // Use local profile for rendering
  if (!localProfile) {
    console.log('No profile found, returning null');
    return null;
  }

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast.success('Note copied to clipboard!');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Starting generation...');
    
    // Clear states at the start
    setError(null);
    setGeneratedContent(null);

    if (!notes.trim()) {
      setError('Please enter some notes to generate from');
      return;
    }

    if (!localProfile) {
      setError('User profile not found');
      return;
    }

    if (localProfile.credits < creditCost) {
      setError(`Not enough credits. You need ${creditCost} credits to generate content.`);
      return;
    }

    setLoading(true);
    console.log('Set loading state, starting API call...');

    try {
      const response = await fetch('/api/notes-rag/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userTopic: notes,
          userId: user?.id,
          model: 'deepseek'
        })
      });

      console.log('API call completed, checking response...');

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      console.log('Received data from API:', data);
      
      if (!data.result) {
        throw new Error('No content received from the API');
      }

      // Set content first
      console.log('Setting generated content...');
      setGeneratedContent(data.result);
      
      // Show success toast
      toast.success('Notes generated successfully!');
      
      // Update profile last
      console.log('Updating profile...');
      try {
        await updateProfile({
          credits: localProfile.credits - creditCost
        });
      } catch (profileError) {
        console.error('Error updating profile:', profileError);
        // Don't throw here, we still want to show the generated content
      }
    } catch (err) {
      console.error('Error generating content:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate content. Please try again.');
    } finally {
      console.log('Setting loading state to false...');
      setLoading(false);
    }
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
            <h1 className="mt-4 text-3xl font-bold text-gray-900">Notes with RAG</h1>
            <p className="mt-2 text-gray-600">
              Generate content from your notes using different AI models
            </p>
          </div>
        </div>

        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-8">
          <div className="mb-6 flex items-center justify-between bg-amber-50 p-4 rounded-lg">
            <span className="text-amber-700">Credits required: {creditCost}</span>
            <span className="font-medium text-amber-700">Your balance: {localProfile?.credits ?? 0}</span>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
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

          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Topic
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter a topic to generate notes about..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 transform-gpu"
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !notes.trim() || (localProfile?.credits || 0) < creditCost}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </span>
              ) : (
                'Generate 5 Notes'
              )}
            </Button>
          </form>

          {generatedContent && (
            <div className="mt-8">
              {/* Llama Notes */}
              {generatedContent.llama.shortNotes.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-[#181819] mb-4">
                    Generated Notes using Llama 3.3 70B for: {notes}
                  </h3>
                  <div className="grid gap-4">
                    {generatedContent.llama.shortNotes.map((note, index) => (
                      <div
                        key={index}
                        className="relative group rounded-lg border border-gray-200 p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div 
                          className="whitespace-pre-wrap font-sans text-[#181819] pr-12"
                          dangerouslySetInnerHTML={{ __html: note }}
                        />
                        <button
                          onClick={() => copyToClipboard(note, index)}
                          className={`absolute top-4 right-4 p-2 rounded-md transition-all duration-200 ${
                            copiedIndex === index
                              ? 'text-green-600 bg-green-50'
                              : 'text-gray-400 hover:text-gray-600 bg-white opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          {copiedIndex === index ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* OpenAI Notes */}
              {generatedContent.openai.shortNotes.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-lg font-semibold text-[#181819] mb-4">
                    Generated Notes using GPT-4 for: {notes}
                  </h3>
                  <div className="grid gap-4">
                    {generatedContent.openai.shortNotes.map((note, index) => (
                      <div
                        key={index}
                        className="relative group rounded-lg border border-gray-200 p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div 
                          className="whitespace-pre-wrap font-sans text-[#181819] pr-12"
                          dangerouslySetInnerHTML={{ __html: note }}
                        />
                        <button
                          onClick={() => copyToClipboard(note, index + 100)}
                          className={`absolute top-4 right-4 p-2 rounded-md transition-all duration-200 ${
                            copiedIndex === index + 100
                              ? 'text-green-600 bg-green-50'
                              : 'text-gray-400 hover:text-gray-600 bg-white opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          {copiedIndex === index + 100 ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 