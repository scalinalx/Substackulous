'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { darkModeClasses } from '@/lib/utils/darkModeClasses';

interface OfferRequest {
  targetAudience: string;
  goal: string;
}

export default function OfferBuilderPage() {
  const [mounted, setMounted] = useState(false);
  const { user, credits, updateCredits, recordUsage, session } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [formData, setFormData] = useState<OfferRequest>({
    targetAudience: '',
    goal: '',
  });
  const [offer, setOffer] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const creditCost = 3;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !user) {
      router.replace('/');
    }
  }, [mounted, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOffer(null);
    setGenerating(true);

    if (!user) {
      setError('You must be logged in to generate an offer.');
      setGenerating(false);
      return;
    }

    if (credits !== null && credits < creditCost) {
      setError(`Not enough credits. You need ${creditCost} credits to generate an offer.`);
      setGenerating(false);
      return;
    }

    try {
      if (!session) {
        console.log('No session found in AuthContext, redirecting to login...');
        router.replace('/');
        return;
      }

      const referenceContent = `
$12K Offer Block Formula

Irrestible End State:
$20K/Month Coaching Enterprise

Problem 1 – Broad Offer:
Coaches create broad offers to avoid missing sales, but it confuses their target buyers.
Irresitible Offer Example: 20 leads per week, Target Niche, Conversion Content

Problem 2 – Big Brand:
Coaches overfocus on gaining popularity and underfocus on selling.
Pre-buy Experience Example: 20 event attendees per month, Opt-in Protocol, Opt-in Gate

Problem 3 – Coffee Chats:
Coaches end up creating friends, not clients.
Conversion Consultations Example: 20% conversion rate (minimum), Conversion Sequence, Conversion Assets

Tools:
- Coaching Blueprints (Landing Pages, Workshop Formulas, Content Marketing, Funnel Building)
- Content Engine (Custom Built GPT's to Help Write Every Content Marketing Asset)
- Sales Scripts (Sales Calls, Offer Documents, Rebuttals, Opt-ins, Conversion Language)

Support:
- Coaches who Close Training Center (Skool)
- Support Coaches (Copywriting Coach and Graphics Coach)
- Live Coaching (Every Tuesday at 3 PM CST)

Offer Name:
Coaches who Close
`;

      const systemPrompt = "You are \"The Irresistible Offer Architect,\" a world-class marketing strategist and conversion copywriting expert specializing in coaching offers. You have a proven track record of transforming vague, intangible ideas into clear, compelling, and measurable offers";
      
      const userPrompt = ` Based on the provided information:
Target Audience: ${formData.targetAudience}
What they help them achieve: ${formData.goal}
Now, generate 10 irresistible offers following these rules:
1) Use specific and measurable outcomes (numbers, percentages, timeframes).
2) Describe the process or system uniquely.
3) Address the target audience's specific problem.
4) Be brief yet clear and persuasive.
5) Use simple language so a 10-year-old can understand.
Provide 10 irresistible offers, each on a separate line.

Then choose the best 3 offers that, in your opinion, are the most compelling and persuasive and stand the highest chance of reaching six figures/month.

For each of the 3 offers, continue the process like this:

Reference Guidelines (extracted from the reference file):
${referenceContent}

Now, generate the final output in the following exact format:

### Irresistible End State
[Your irresistible end state here]
[Offer Name]
[Offer Description]

### Problem 1
[Problem statement: 1-3 words]
### Negative Impact 1
[Negative impact: 15 words max]
### 3 Outcomes
- Outcome A (3 words max)
- Outcome B (3 words max)
- Outcome C (3 words max)
### Measurable Checkpoint 1
[Irresistible checkpoint with numbers/percent/timeframe]

---
### Problem 2
[Problem statement: 1-3 words]
### Negative Impact 2
[Negative impact: 15 words max]
### 3 Outcomes
- Outcome A (3 words max)
- Outcome B (3 words max)
- Outcome C (3 words max)
### Measurable Checkpoint 2
[Irresistible checkpoint with numbers/percent/timeframe]

---
### Problem 3
[Problem statement: 1-3 words]
### Negative Impact 3
[Negative impact: 15 words max]
### 3 Outcomes
- Outcome A (3 words max)
- Outcome B (3 words max)
- Outcome C (3 words max)
### Measurable Checkpoint 3
[Irresistible checkpoint with numbers/percent/timeframe]

Top 5 delivery vehicles:
[Delivery vehicle 1]
[Delivery vehicle 2]
[Delivery vehicle 3]
[Delivery vehicle 4]
[Delivery vehicle 5]

Top 2 delivery methods:
[Delivery method 1]
[Delivery method 2]`;

      console.log('Using session from AuthContext:', {
        access_token: session.access_token ? '[PRESENT]' : '[MISSING]',
      });

      console.log('Complete prompt: ', systemPrompt + '\n\n' + userPrompt);

      const response = await fetch('/api/together/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          systemPrompt,
          userPrompt,
          model: "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
          temperature: 0.97
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate offer');
      }

      const data = await response.json();

      if (!data.result) {
        throw new Error('No offer was generated.');
      }
      
      setOffer(data.result);

      if (credits !== null) {
        await updateCredits(credits - creditCost);
        
        // Record usage after credits are deducted
        try {
          const actionDescription = `Used Offer Builder to create offer for target audience: ${formData.targetAudience}`;
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

      // Log the generation
      await supabase
        .from('generation_logs')
        .insert({
          user_id: user.id,
          generation_type: 'offer_builder',
          prompt: JSON.stringify({ targetAudience: formData.targetAudience, goal: formData.goal }),
          created_at: new Date().toISOString(),
        });
        
    } catch (err) {
      console.error('Error in offer generation:', err);
      setError((err as Error).message);
      setOffer(null);
    } finally {
      setGenerating(false);
    }
  };

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
          <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">💰 Create Your 6-Figure Offer</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Make an irresistible high-ticket offer that converts subscribers into paying customers—engineered to hit 6 figures/month.
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

        {!offer ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Audience <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.targetAudience}
                onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                placeholder="Describe your ideal customer in detail (e.g., Female health coaches aged 30-45 who struggle with client acquisition)"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                What do you help them achieve? <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.goal}
                onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value }))}
                placeholder="What transformation or results do you help your clients achieve? (e.g., Build a consistent client pipeline and reach $10K/month in revenue)"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                rows={3}
                required
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={generating}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 ${
                  generating ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {generating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  'Craft Irresistible Offer'
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="prose prose-amber max-w-none dark:prose-invert dark:prose-headings:text-white dark:prose-p:text-gray-300">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {offer}
              </ReactMarkdown>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={() => setOffer(null)}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                Create Another Offer
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(offer);
                }}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 