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

export default function OutlineGenerator() {
  const [mounted, setMounted] = useState(false);
  const { user, credits, updateCredits, session } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [formData, setFormData] = useState<OutlineRequest>({
    topic: '',
    keyPoints: '',
    targetAudience: '',
    objective: 'Thought leadership',
    format: 'How-to guide',
    knowledgeLevel: 'Intermediate',
    tone: ['Professional'],
    wordCount: 1500
  });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outline, setOutline] = useState<string | null>(null);
  const creditCost = 2;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !user) {
      router.replace('/');
    }
  }, [mounted, user, router]);

  if (!mounted || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const handleToneToggle = (tone: string) => {
    setFormData(prev => ({
      ...prev,
      tone: prev.tone.includes(tone)
        ? prev.tone.filter(t => t !== tone)
        : [...prev.tone, tone]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Starting outline generation...');
    console.log('Profile:', { id: user?.id, credits });
    
    if (!formData.topic.trim()) {
      setError('Topic is required');
      return;
    }

    if (!user) {
      setError('User not found');
      return;
    }

    if ((credits ?? 0) < creditCost) {
      setError(`Not enough credits. You need ${creditCost} credits to generate an outline.`);
      return;
    }

    setError(null);
    setGenerating(true);
    setOutline(null);

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
            <h1 className="mt-4 text-3xl font-bold text-gray-900">Generate Outline</h1>
            <p className="mt-2 text-gray-600">
              Create a structured outline for your next viral post
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
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Audience <span className="text-gray-500">(optional)</span>
              </label>
              <textarea
                value={formData.targetAudience}
                onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                placeholder="Who is your post for?"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Objective <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.objective}
                onChange={(e) => setFormData(prev => ({ ...prev, objective: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                required
              >
                <option value="">Select an objective</option>
                <option value="Educate">Educate</option>
                <option value="Entertain">Entertain</option>
                <option value="Inspire">Inspire</option>
                <option value="Persuade">Persuade</option>
                <option value="Solve a Problem">Solve a Problem</option>
                <option value="Growth">Growth</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Format <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.format}
                onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                required
              >
                <option value="How-to guide">How-to Guide</option>
                <option value="List post">List Post</option>
                <option value="Case study">Case Study</option>
                <option value="Opinion piece">Opinion Piece</option>
                <option value="In-Depth Research">In-Depth Research</option>
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
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Word Count
              </label>
              <select
                value={formData.wordCount}
                onChange={(e) => setFormData(prev => ({ ...prev, wordCount: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
              >
                <option value="500">500 words</option>
                <option value="800">800 words</option>
                <option value="1000">1,000 words</option>
                <option value="1500">1,500 words</option>
                <option value="2000">2,000 words</option>
                <option value="2500">2,500 words</option>
                <option value="3000">3,000 words</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tone (multiple selection)
              </label>
              <div className="flex flex-wrap gap-2">
                {['Professional', 'Casual', 'Humorous', 'Authoritative', 'Empathetic', 'Technical', 'Inspirational'].map((tone) => (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => handleToneToggle(tone)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      formData.tone.includes(tone)
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={generating || (credits ?? 0) < creditCost}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3 px-4 rounded-lg 
                       hover:from-amber-600 hover:to-amber-700 transition-all focus:outline-none focus:ring-2 
                       focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed 
                       disabled:hover:from-amber-500 disabled:hover:to-amber-600"
            >
              {generating ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Outline...
                </span>
              ) : 'Generate Outline'}
            </button>
          </form>

          {outline && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Outline</h2>
              <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                <div className="prose prose-amber prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-h4:text-base prose-p:text-gray-600 prose-strong:text-gray-900 prose-ul:list-disc prose-ol:list-decimal max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({...props}) => <h1 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b" {...props} />,
                      h2: ({...props}) => <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4" {...props} />,
                      h3: ({...props}) => <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3" {...props} />,
                      h4: ({...props}) => <h4 className="text-base font-semibold text-gray-700 mt-4 mb-2" {...props} />,
                      ul: ({...props}) => <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-600" {...props} />,
                      ol: ({...props}) => <ol className="list-decimal pl-6 mb-4 space-y-2 text-gray-600" {...props} />,
                      li: ({...props}) => <li className="mb-1 text-gray-600" {...props} />,
                      p: ({...props}) => <p className="mb-4 text-gray-600 whitespace-pre-wrap" {...props} />,
                      strong: ({...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                      em: ({...props}) => <em className="text-gray-800 italic" {...props} />,
                      blockquote: ({...props}) => (
                        <blockquote className="border-l-4 border-amber-500 pl-4 py-2 my-4 bg-amber-50/50 text-gray-700 italic" {...props} />
                      ),
                      code: ({...props}) => (
                        <code className="px-1 py-0.5 bg-gray-100 rounded text-sm font-mono text-amber-600" {...props} />
                      ),
                    }}
                    className="whitespace-pre-wrap break-words"
                  >
                    {outline}
                  </ReactMarkdown>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setOutline(null)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear Outline
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 