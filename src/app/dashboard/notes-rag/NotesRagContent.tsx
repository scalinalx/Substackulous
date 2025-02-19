'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Import Link


export default function NotesRagContent() {
  const router = useRouter();
  const { user, profile, updateCredits, session, credits } = useAuth();
  const [loading, setLoading] = useState(false);
  // Store both model responses as strings.
  const [generatedNotes, setGeneratedNotes] = useState<{ notesTurbo: string; notesLlama: string }>({
    notesTurbo: "",
    notesLlama: ""
  });
  const [topic, setTopic] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const creditCost = 1;
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    setMounted(true);
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Helper function to format a note in Markdown.
  const formatNoteText = (note: string): string => {
    // Remove any curly braces, square brackets, or quotes.
    let cleaned = note.replace(/[\{\}\[\]"]+/g, "").trim();
    // Replace multiple spaces with one space.
    cleaned = cleaned.replace(/\s+/g, " ");
    // Split into sentences at a period that is followed by whitespace.
    const sentences = cleaned.split(/(?<=\.)\s+/);
    // Join sentences with a newline.
    return sentences.join("\n");
  };

  // Handler to copy a note to clipboard.
  const copyNote = async (note: string) => {
    try {
      const formatted = formatNoteText(note);
      await navigator.clipboard.writeText(formatted);
      // Optionally, you can add a small feedback here (e.g., toast notification).
    } catch (err) {
      console.error("Failed to copy note:", err);
    }
  };

  const handleGenerateNotes = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setGeneratedNotes({ notesTurbo: "", notesLlama: "" });

    if (!topic.trim()) {
      setError("Please enter a topic");
      return;
    }

    if (!session?.access_token) {
      setError("No valid session. Please sign in again.");
      return;
    }

    if (!user || !profile) {
      setError("Please sign in to continue");
      return;
    }

    if (credits === null || credits < creditCost) {
      setError(`Not enough credits. You need ${creditCost} credit to generate notes.`);
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
        body: JSON.stringify({ topic })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to generate notes: ${response.status}`);
      }

      const responseData = await response.json();
      if (
        !responseData.notesTurbo ||
        typeof responseData.notesTurbo !== "string" ||
        !responseData.notesLlama ||
        typeof responseData.notesLlama !== "string"
      ) {
        throw new Error("Invalid response format");
      }

      console.log("Raw notes received:", responseData);

      // Deduct credits (frontend approach as in TitlesContent.tsx).
      try {
        await updateCredits(credits - creditCost);
        console.log("Credits updated");
      } catch (updateError) {
        console.error("Error updating credits:", updateError);
        setError("Failed to update credits. Please refresh the page.");
        return;
      }

      if (isMounted.current) {
        setGeneratedNotes({
          notesTurbo: responseData.notesTurbo,
          notesLlama: responseData.notesLlama
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate notes. Please try again.");
      setGeneratedNotes({ notesTurbo: "", notesLlama: "" });
      return;
    } finally {
      setLoading(false);
      console.log("Notes generation complete");
    }
  }, [topic, session, user, profile, creditCost, updateCredits, credits]);

  // Helper to split notes based on delimiter.
  const splitNotes = (notes: string): string[] => {
    return notes.split("###---###").map(note => note.trim()).filter(note => note);
  };

  const turboNotes = splitNotes(generatedNotes.notesTurbo);
  const llamaNotes = splitNotes(generatedNotes.notesLlama);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header: show cost and balance */}
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
            </div>
        </div>
      <div className="mb-6 flex items-center justify-between bg-amber-50 p-4 rounded-lg">
        <span className="text-amber-700">Credits required: {creditCost}</span>
        <span className="font-medium text-amber-700">Your balance: {credits ?? 0}</span>
      </div>

      <h1 className="text-3xl font-bold mb-4">Viral Notes Generator</h1>
      <form onSubmit={handleGenerateNotes} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Topic <span className="text-red-500">*</span>
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a topic for your notes..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            rows={2}
            required
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !mounted}
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
          ) : "Generate Notes"}
        </button>
      </form>
      {error && (
        <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-400">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {(turboNotes.length > 0 || llamaNotes.length > 0) && (
        <div className="mt-8 space-y-8">
          {/* Model Turbo Results */}
          {turboNotes.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Notes from Model Turbo</h2>
              <div className="space-y-4">
                {turboNotes.map((note, index) => (
                  <div key={`turbo-${index}`} className="border p-4 rounded bg-gray-50 relative">
                    <pre className="whitespace-pre-wrap">{note}</pre>
                    <button
                      onClick={() => copyNote(note)}
                      className="absolute top-2 right-2 text-sm text-gray-500 hover:text-gray-700"
                    >
                      Copy
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Model Llama Results */}
          {llamaNotes.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Notes from Model Llama</h2>
              <div className="space-y-4">
                {llamaNotes.map((note, index) => (
                  <div key={`llama-${index}`} className="border p-4 rounded bg-gray-50 relative">
                    <pre className="whitespace-pre-wrap">{note}</pre>
                    <button
                      onClick={() => copyNote(note)}
                      className="absolute top-2 right-2 text-sm text-gray-500 hover:text-gray-700"
                    >
                      Copy
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
