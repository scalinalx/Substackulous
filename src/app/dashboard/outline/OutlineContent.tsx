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
  const { user, credits, updateCredits, session } = useAuth();
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
  const creditCost = 2;

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
      }
    } catch (err) {
      console.error('Error in outline generation:', err);
      setError((err as Error).message);
      setOutline(null);
    } finally {
      setGenerating(false);
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
            <h1 className="mt-4 text-3xl font-bold text-gray-900">📝 Effortless Post Outline Builder</h1>
            <p className="mt-2 text-gray-600">
              Drop in an idea, get a ready-to-use post structure—just fill in the blanks and hit publish.
            </p>
          </div>
        </div>

        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-8">
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

          <div className="mb-6 flex items-center justify-between bg-amber-50 p-4 rounded-lg">
            <span className="text-amber-700">Credits required: {creditCost}</span>
            <span className="font-medium text-amber-700">Your balance: {credits ?? 0}</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topic <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.topic}
                onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                placeholder="What's your post about?"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                rows={2}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Key Points <span className="text-gray-500">(optional)</span>
              </label>
              <textarea
                value={formData.keyPoints}
                onChange={(e) => setFormData(prev => ({ ...prev, keyPoints: e.target.value }))}
                placeholder="Key points you want to cover in your post"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Audience <span className="text-gray-500">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                  placeholder="Who are you writing for?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Objective <span className="text-gray-500">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.objective}
                  onChange={(e) => setFormData(prev => ({ ...prev, objective: e.target.value }))}
                  placeholder="What's the goal of your post?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Format
                </label>
                <select
                  value={formData.format}
                  onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Knowledge Level
                </label>
                <select
                  value={formData.knowledgeLevel}
                  onChange={(e) => setFormData(prev => ({ ...prev, knowledgeLevel: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Word Count
              </label>
              <input
                type="number"
                value={formData.wordCount}
                onChange={(e) => setFormData(prev => ({ ...prev, wordCount: parseInt(e.target.value) || 1500 }))}
                min="500"
                max="5000"
                step="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
              />
              <div className="mt-1 flex justify-between text-xs text-gray-500">
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
          </form>

          {outline && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200"
            >
              <h2 className="text-xl font-semibold mb-4">Your Outline</h2>
              <div className="prose prose-amber max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-xl font-semibold mt-5 mb-3" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-lg font-medium mt-4 mb-2" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-3" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-3" {...props} />,
                    li: ({ node, ...props }) => <li className="my-1" {...props} />,
                    p: ({ node, ...props }) => <p className="my-2" {...props} />,
                    blockquote: ({ node, ...props }) => (
                      <blockquote className="border-l-4 border-amber-300 pl-4 italic my-4" {...props} />
                    ),
                    code: ({ node, inline, ...props }: CustomCodeProps) =>
                      inline ? (
                        <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props} />
                      ) : (
                        <pre className="bg-gray-100 p-4 rounded overflow-x-auto my-4">
                          <code {...props} />
                        </pre>
                      ),
                  }}
                >
                  {outline}
                </ReactMarkdown>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(outline);
                    // You could add a toast notification here
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-md hover:bg-amber-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy to Clipboard
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
} 