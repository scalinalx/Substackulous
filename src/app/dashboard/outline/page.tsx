'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface OutlineRequest {
  objective: string;
  format: string;
  knowledgeLevel: string;
  painPoints: string;
  keyMessage: string;
  subtopics: string[];
  wordCount: number;
  keywords: string[];
  tone: string[];
  template: string;
}

export default function OutlinePage() {
  const { user, profile, updateProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [generating, setGenerating] = useState(false);

  const [formData, setFormData] = useState<OutlineRequest>({
    objective: 'Brand awareness',
    format: 'How-to guide',
    knowledgeLevel: 'Beginner',
    painPoints: '',
    keyMessage: '',
    subtopics: ['', '', ''],
    wordCount: 1000,
    keywords: [''],
    tone: [],
    template: 'PAS'
  });

  const handleSubtopicChange = (index: number, value: string) => {
    const newSubtopics = [...formData.subtopics];
    newSubtopics[index] = value;
    setFormData(prev => ({ ...prev, subtopics: newSubtopics }));
  };

  const handleKeywordChange = (index: number, value: string) => {
    const newKeywords = [...formData.keywords];
    newKeywords[index] = value;
    setFormData(prev => ({ ...prev, keywords: newKeywords }));
  };

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
    setError(null);
    setAiResponse(''); // Reset previous response
    setGenerating(true);

    try {
      if (!user || !profile) {
        throw new Error('You must be logged in to generate an outline');
      }

      if (profile.credits < 2) {
        throw new Error('Insufficient credits. Please purchase more credits to continue.');
      }

      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Authentication error. Please try logging in again.');
      }

      // Create an AbortController for the fetch request
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000); // Increased to 60 seconds

      try {
        const response = await fetch('/api/outline', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            userId: user.id,
            prompt: `Act as a master content architect and Pulitzer-winning editorial director. The best in the world at writing viral, engaging Substack posts. 
Create a ${formData.format} outline using:

**Strategic Foundation**
- Primary Goal: ${formData.objective}
- Audience Profile: ${formData.knowledgeLevel} | Key Pain Points: ${formData.painPoints}

**Content Core**
- Central Thesis: "${formData.keyMessage}"
- Supporting Pillars: ${formData.subtopics.filter(Boolean).join(', ')}
- Target Length: ${formData.wordCount} words

**Optimization Levers**
- SEO Keywords: ${formData.keywords.filter(Boolean).join(', ')}
- Tone Blend: ${formData.tone.join(', ')}
- Structural Template: ${formData.template}

**Output Requirements**
1. Title Options (3 variants)
2. Meta Description (160 chars)
3. ${formData.template}-Based Section Framework
4. Data Integration Points
5. Engagement Hooks (Open Loops/Story Elements)
6. SEO Optimization Checklist`
          }),
          signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to generate outline');
        }

        const data = await response.json();

        if (!data.content) {
          throw new Error('No content received from the API');
        }

        setAiResponse(data.content);
        
        // Refresh the profile to get updated credits
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (updatedProfile) {
          updateProfile(updatedProfile);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        }
        throw error;
      }

    } catch (error) {
      console.error('Error:', error);
      setError((error as Error).message);
      setAiResponse(''); // Clear any partial response
    } finally {
      setGenerating(false);
    }
  };

  const handlePurchaseCredits = () => {
    window.open('https://buy.stripe.com/3cs3dB1fa4645Da7sw', '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Link
          href="/dashboard"
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Generate Outline</h1>
        <p className="text-gray-600 mb-8">
          Create a structured outline for your next viral post
        </p>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
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
          <span className="text-amber-700">Credits required: 2</span>
          <span className="font-medium text-amber-700">Your balance: {profile?.credits ?? 0}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Primary Objective */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primary Objective
            </label>
            <select
              value={formData.objective}
              onChange={(e) => setFormData(prev => ({ ...prev, objective: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
            >
              <option className="text-gray-900" value="Brand awareness">Brand awareness</option>
              <option className="text-gray-900" value="Lead generation">Lead generation</option>
              <option className="text-gray-900" value="Thought leadership">Thought leadership</option>
              <option className="text-gray-900" value="Community building">Community building</option>
              <option className="text-gray-900" value="Product promotion">Product promotion</option>
            </select>
          </div>

          {/* Content Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content Format
            </label>
            <select
              value={formData.format}
              onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
            >
              <option className="text-gray-900" value="How-to guide">How-to guide</option>
              <option className="text-gray-900" value="Listicle">Listicle</option>
              <option className="text-gray-900" value="Case study">Case study</option>
              <option className="text-gray-900" value="Opinion piece">Opinion piece</option>
              <option className="text-gray-900" value="Interview/Q&A">Interview/Q&A</option>
              <option className="text-gray-900" value="Data-driven analysis">Data-driven analysis</option>
            </select>
          </div>

          {/* Reader Knowledge Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reader Knowledge Level
            </label>
            <select
              value={formData.knowledgeLevel}
              onChange={(e) => setFormData(prev => ({ ...prev, knowledgeLevel: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
            >
              <option className="text-gray-900" value="Beginner">Beginner (100% new to topic)</option>
              <option className="text-gray-900" value="Intermediate">Intermediate (Some familiarity)</option>
              <option className="text-gray-900" value="Advanced">Advanced (Seeking deep insights)</option>
            </select>
          </div>

          {/* Reader Pain Points */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reader Pain Points
            </label>
            <textarea
              value={formData.painPoints}
              onChange={(e) => setFormData(prev => ({ ...prev, painPoints: e.target.value }))}
              placeholder="What specific problems does your audience want solved?"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
              rows={3}
            />
          </div>

          {/* Key Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Key Message
            </label>
            <input
              type="text"
              value={formData.keyMessage}
              onChange={(e) => setFormData(prev => ({ ...prev, keyMessage: e.target.value }))}
              placeholder="The one thing readers should remember"
              maxLength={150}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
            />
            <p className="mt-1 text-sm text-gray-500">
              {150 - formData.keyMessage.length} characters remaining
            </p>
          </div>

          {/* Subtopics */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subtopics
            </label>
            <div className="space-y-2">
              {formData.subtopics.map((subtopic, index) => (
                <input
                  key={index}
                  type="text"
                  value={subtopic}
                  onChange={(e) => handleSubtopicChange(index, e.target.value)}
                  placeholder={`Supporting point ${index + 1}`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                />
              ))}
            </div>
          </div>

          {/* Word Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Desired Length: {formData.wordCount} words
            </label>
            <input
              type="range"
              min="800"
              max="2000"
              step="100"
              value={formData.wordCount}
              onChange={(e) => setFormData(prev => ({ ...prev, wordCount: parseInt(e.target.value) }))}
              className="w-full"
            />
          </div>

          {/* SEO Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SEO Keywords
            </label>
            <div className="space-y-2">
              {formData.keywords.map((keyword, index) => (
                <input
                  key={index}
                  type="text"
                  value={keyword}
                  onChange={(e) => handleKeywordChange(index, e.target.value)}
                  placeholder={index === 0 ? "Primary keyword" : `Secondary keyword ${index}`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                />
              ))}
              {formData.keywords.length < 4 && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, keywords: [...prev.keywords, ''] }))}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  + Add keyword
                </button>
              )}
            </div>
          </div>

          {/* Tone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tone
            </label>
            <div className="flex flex-wrap gap-2">
              {['Authoritative', 'Conversational', 'Provocative', 'Inspirational', 'Humorous'].map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => handleToneToggle(tone)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                    ${formData.tone.includes(tone)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>

          {/* Outline Template */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Outline Template
            </label>
            <select
              value={formData.template}
              onChange={(e) => setFormData(prev => ({ ...prev, template: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
            >
              <option className="text-gray-900" value="PAS">PAS (Problem-Agitate-Solve)</option>
              <option className="text-gray-900" value="AIDA">AIDA (Attention-Interest-Desire-Action)</option>
              <option className="text-gray-900" value="STAR">STAR (Situation-Task-Action-Result)</option>
              <option className="text-gray-900" value="Custom">Custom (User-defined)</option>
            </select>
          </div>

          {/* Generate Button */}
          <button
            type="submit"
            disabled={generating}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-md 
                     hover:from-amber-600 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 
                     focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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

        {/* AI Response */}
        {aiResponse && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Outline</h2>
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 prose prose-indigo prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-h4:text-base prose-p:text-gray-600 prose-strong:text-gray-900 prose-em:text-gray-800 prose-pre:bg-gray-100 prose-pre:p-4 prose-pre:rounded prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:text-gray-800 prose-ul:list-disc prose-ol:list-decimal prose-li:text-gray-600 max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {aiResponse}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 