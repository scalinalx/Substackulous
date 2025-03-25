'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Components } from 'react-markdown';
import { darkModeClasses } from '@/lib/utils/darkModeClasses';

// Define a custom interface for code component props
interface CustomCodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

interface OutlineRequest {
  topic: string;
  keyPoints: string;
  targetAudience: string;
  objective: string;
  format: string;
  knowledgeLevel: string;
  tone: string[];
  wordCount: number;
}

export default function OutlineContent() {
  const [mounted, setMounted] = useState(false);
  const { user, credits, updateCredits, recordUsage, session } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [formData, setFormData] = useState<OutlineRequest>({
    topic: '',
    keyPoints: '',
    targetAudience: '',
    objective: '',
    format: 'blog post',
    knowledgeLevel: 'intermediate',
    tone: ['informative'],
    wordCount: 1500,
  });
  const [outline, setOutline] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const creditCost = 1;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !user) {
      router.replace('/');
    }
  }, [mounted, user, router]);

  const handleToneToggle = (tone: string) => {
    setFormData(prev => {
      const currentTones = [...prev.tone];
      if (currentTones.includes(tone)) {
        return { ...prev, tone: currentTones.filter(t => t !== tone) };
      } else {
        return { ...prev, tone: [...currentTones, tone] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOutline(null);
    setGenerating(true);

    if (!user) {
      setError('You must be logged in to generate an outline.');
      setGenerating(false);
      return;
    }

    if (credits !== null && credits < creditCost) {
      setError(`Not enough credits. You need ${creditCost} credits to generate an outline.`);
      setGenerating(false);
      return;
    }

    try {
      if (!session) {
        console.log('No session found in AuthContext, redirecting to login...');
        router.replace('/');
        return;
      }

      console.log('Using session from AuthContext:', {
        access_token: session.access_token ? '[PRESENT]' : '[MISSING]',
      });

      const response = await fetch('/api/outline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          userId: user.id,
          prompt: `Create a ${formData.format} outline using:

**Strategic Foundation**
- Primary Goal: ${formData.objective}
- Audience Profile: ${formData.knowledgeLevel} | Target Audience: ${formData.targetAudience || 'General audience'}
${formData.keyPoints ? `- Key Points to Address:\n${formData.keyPoints}` : ''}

**Content Core**
- Central Theme: "${formData.topic}"
- Target Length: ${formData.wordCount} words
- Content Style: ${formData.tone.join(', ')}

**Output Requirements**
1. Title Options (3 viral headline variants)
2. Meta Description (160 chars)
3. Detailed Section Framework
   - Introduction (Hook + Context)
   - Main Body (3-5 key sections)
   - Conclusion + Call to Action
4. Key Data Points to Include
5. Engagement Hooks (Open Loops/Story Elements)
6. SEO Optimization Notes

Format the outline with clear hierarchical structure using markdown.`
        }),
      });
      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        throw new Error(errorData.error || 'Failed to generate outline');
      }

      const data = await response.json();
      console.log('Raw API response:', data.content);

      if (!data.content) {
        throw new Error('No outline was generated.');
      }

      const cleanedContent = data.content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      console.log('Content after removing think tags:', cleanedContent);
      
      const formattedContent = cleanedContent
        .replace(/^\s*\n/gm, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      
      console.log('Final formatted content:', formattedContent);
      
      setOutline(formattedContent);
      console.log('Outline state updated with cleaned and formatted content');

      if (credits !== null) {
        await updateCredits(credits - creditCost);
        
        // Record usage after credits are deducted
        try {
          const actionDescription = `Used Outline Builder to create outline on topic: ${formData.topic} with primary goal: ${formData.objective}`;
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
      }
    } catch (err) {
      console.error('Error in outline generation:', err);
      setError((err as Error).message);
      setOutline(null);
    } finally {
      setGenerating(false);
    }
  };

  if (!mounted || !user) {
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
          <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">📝 Effortless Post Outline Builder</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Drop in an idea, get a ready-to-use post structure—just fill in the blanks and hit publish.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-700/50 sm:rounded-xl p-8">
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

        <div className="mb-6 flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
          <span className="text-amber-700 dark:text-amber-400">Credits required: {creditCost}</span>
          <span className="font-medium text-amber-700 dark:text-amber-400">Your balance: {credits ?? 0}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Topic <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.topic}
              onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
              placeholder="What's your post about?"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
              rows={2}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Key Points <span className="text-gray-500 dark:text-gray-400">(optional)</span>
            </label>
            <textarea
              value={formData.keyPoints}
              onChange={(e) => setFormData(prev => ({ ...prev, keyPoints: e.target.value }))}
              placeholder="Key points you want to cover in your post"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Audience <span className="text-gray-500 dark:text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={formData.targetAudience}
                onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                placeholder="Who are you writing for?"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Objective <span className="text-gray-500 dark:text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={formData.objective}
                onChange={(e) => setFormData(prev => ({ ...prev, objective: e.target.value }))}
                placeholder="What's the goal of your post?"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Format
              </label>
              <select
                value={formData.format}
                onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
              >
                <option value="blog post">Blog Post</option>
                <option value="newsletter">Newsletter</option>
                <option value="how-to guide">How-To Guide</option>
                <option value="listicle">Listicle</option>
                <option value="case study">Case Study</option>
                <option value="opinion piece">Opinion Piece</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Knowledge Level
              </label>
              <select
                value={formData.knowledgeLevel}
                onChange={(e) => setFormData(prev => ({ ...prev, knowledgeLevel: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tone
            </label>
            <div className="flex flex-wrap gap-2">
              {['informative', 'conversational', 'professional', 'humorous', 'inspirational', 'persuasive', 'authoritative'].map(tone => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => handleToneToggle(tone)}
                  className={`px-3 py-1 text-sm rounded-full capitalize ${
                    formData.tone.includes(tone)
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Word Count
            </label>
            <input
              type="number"
              value={formData.wordCount}
              onChange={(e) => setFormData(prev => ({ ...prev, wordCount: parseInt(e.target.value) || 1500 }))}
              min="500"
              max="5000"
              step="100"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
            />
            <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>500</span>
              <span>5000</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={generating || !mounted || !user}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-md hover:from-amber-600 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {generating ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </span>
            ) : 'Generate Outline'}
          </button>

          {outline && (
            <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Your Outline</h2>
              <div className="prose max-w-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-600 dark:prose-p:text-gray-300">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {outline}
                </ReactMarkdown>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(outline);
                    // You could add a toast notification here
                  }}
                  className="px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-md hover:bg-amber-200 dark:hover:bg-amber-900/50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors"
                >
                  Copy to Clipboard
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
} 