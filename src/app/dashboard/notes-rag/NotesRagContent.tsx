'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';

export default function NotesRagContent() {
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, session } = useAuth();
  const router = useRouter();
  
  const handleGenerateNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotes("");
    
    if (!topic.trim()) {
      setError("Please enter a topic.");
      return;
    }

    if (!session) {
      console.log('No session found in AuthContext, redirecting to login...');
      router.replace('/');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch("/api/notes-rag/analyze", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ topic }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error generating notes");
      }
      
      const data = await response.json();
      setNotes(data.notes);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
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
            <h1 className="mt-4 text-3xl font-bold text-gray-900">Generate Viral Notes</h1>
            <p className="mt-2 text-gray-600">
              Create engaging, viral-worthy notes for your content
            </p>
          </div>
        </div>

        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-8">
          <form onSubmit={handleGenerateNotes} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topic <span className="text-red-500">*</span>
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="What would you like to write about?"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                rows={3}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-md
                      hover:from-amber-600 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500
                      focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Notes...
                </span>
              ) : 'Generate Notes'}
            </button>
          </form>

          {error && (
            <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4">
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

          {notes && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Notes</h2>
              <div className="prose prose-amber prose-lg max-w-none">
                {notes.split('###---###').map((note, index) => (
                  <div key={index} className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="whitespace-pre-wrap">{note.trim()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 