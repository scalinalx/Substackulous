'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function OutlineGenerator() {
  const router = useRouter();
  const { profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generatedOutline, setGeneratedOutline] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [keyPoints, setKeyPoints] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [objective, setObjective] = useState('');
  const [format, setFormat] = useState('detailed');
  const [knowledgeLevel, setKnowledgeLevel] = useState('intermediate');
  const [tone, setTone] = useState<string[]>(['professional', 'engaging']);
  const [wordCount, setWordCount] = useState('1500');
  const [error, setError] = useState<string | null>(null);
  const creditCost = 2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!profile) {
      setError('User profile not found');
      return;
    }

    if (profile.credits < creditCost) {
      setError(`Not enough credits. You need ${creditCost} credits to generate an outline.`);
      return;
    }

    try {
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setError('Authentication error. Please try again.');
        return;
      }

      const response = await fetch('/api/outline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          userId: profile.id,
          prompt: `Act as a master content architect and Pulitzer-winning editorial director. The best in the world at writing viral, engaging Substack posts.
Create a ${format} outline using:

**Strategic Foundation**
- Primary Goal: ${objective}
- Audience Profile: ${knowledgeLevel} | Target Audience: ${targetAudience || 'General audience'}
${keyPoints ? `- Key Points to Address:\n${keyPoints}` : ''}

**Content Core**
- Central Theme: "${topic}"
- Target Length: ${wordCount} words
- Content Style: ${tone.join(', ')}

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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate outline');
      }

      const data = await response.json();
      setGeneratedOutline(data.content);
      
      // Update credits only after successful completion
      const updatedProfile = {
        ...profile,
        credits: profile.credits - creditCost,
      };
      await updateProfile(updatedProfile);
    } catch (err) {
      console.error('Error in outline generation:', err);
      setError((err as Error).message);
      setGeneratedOutline(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between bg-amber-50 p-4 rounded-lg">
        <span className="text-amber-700">Credits required: {creditCost}</span>
        <span className="font-medium text-amber-700">Your balance: {profile?.credits ?? 0}</span>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Topic <span className="text-red-500">*</span>
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Substack Growth Hacks"
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
            value={keyPoints}
            onChange={(e) => setKeyPoints(e.target.value)}
            placeholder="e.g., Niche selection, Content strategy, Monetization"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Target Audience <span className="text-gray-500">(optional)</span>
          </label>
          <textarea
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="e.g., Tech-savvy creators looking to grow their newsletter"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Primary Objective <span className="text-red-500">*</span>
          </label>
          <select
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
            required
          >
            <option value="">Select an objective</option>
            <option value="Educate">Educate</option>
            <option value="Entertain">Entertain</option>
            <option value="Inspire">Inspire</option>
            <option value="Persuade">Persuade</option>
            <option value="Solve a Problem">Solve a Problem</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Knowledge Level <span className="text-red-500">*</span>
          </label>
          <select
            value={knowledgeLevel}
            onChange={(e) => setKnowledgeLevel(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
            required
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Word Count <span className="text-red-500">*</span>
          </label>
          <select
            value={wordCount}
            onChange={(e) => setWordCount(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
            required
          >
            <option value="1000">1,000 words</option>
            <option value="1500">1,500 words</option>
            <option value="2000">2,000 words</option>
            <option value="2500">2,500 words</option>
          </select>
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
              Generating...
            </span>
          ) : 'Generate Outline'}
        </button>
      </form>

      {generatedOutline && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Outline</h2>
          <div className="prose prose-amber max-w-none bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4 text-gray-900" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-semibold mb-3 text-gray-800" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-lg font-medium mb-2 text-gray-800" {...props} />,
                h4: ({node, ...props}) => <h4 className="text-base font-medium mb-2 text-gray-700" {...props} />,
                p: ({node, ...props}) => <p className="mb-4 text-gray-600" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-2" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />,
                li: ({node, ...props}) => <li className="text-gray-600" {...props} />,
                blockquote: ({node, ...props}) => (
                  <blockquote className="border-l-4 border-amber-500 pl-4 my-4 italic text-gray-600" {...props} />
                ),
                hr: ({node, ...props}) => <hr className="my-8 border-t border-gray-200" {...props} />,
                strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                em: ({node, ...props}) => <em className="italic text-gray-700" {...props} />,
              }}
            >
              {generatedOutline}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
} 