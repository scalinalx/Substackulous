import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

interface SubstackPost {
  title: string;
  preview?: string;
  likes: number;
  comments: number;
  restacks: number;
  url: string;
}

export const maxDuration = 45;

function formatPostsForAnalysis(posts: SubstackPost[]): string {
  return posts
    .map((post, index) => {
      const totalEngagement = post.likes + post.comments + post.restacks;
      return `Post ${index + 1}
${post.title}
${post.preview || 'No preview available'}
Likes: ${post.likes} Comments: ${post.comments} Re-stacks: ${post.restacks} Total Engagement: ${totalEngagement}
----`;
    })
    .join('\n\n');
}

export async function POST(request: Request) {
  try {
    const { posts } = await request.json();

    if (!Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or empty posts array' },
        { status: 400 }
      );
    }

    // Sort posts by total engagement and take top 20
    const top20Posts = [...posts]
      .sort((a, b) => {
        const engagementA = a.likes + a.comments + a.restacks;
        const engagementB = b.likes + b.comments + b.restacks;
        return engagementB - engagementA;
      })
      .slice(0, 20);

    const formattedPosts = formatPostsForAnalysis(top20Posts);

    // Random temperature between 1.2 and 1.62
    const temperature = 1.2 + Math.random() * 0.42;

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    const prompt = `You are an expert writing analyst, marketing strategist, and data scientist. Your job is to deliver a detailed, evidence-based critique of the provided Substack posts. You leverage deep expertise in content marketing, copywriting, user engagement, writing style, and publication strategy to produce nuanced, actionable recommendations.

I am providing you with the top 20 Substack posts from a single creator, sorted by total engagement. Each post entry includes:

Post Number
Title (Headline)
Preview (approx. 500 characters of the intro or excerpt)
Engagement Metrics: Likes, Comments, Restacks, Total Engagement
I need you to:

Read and analyze all 20 posts to find recurring patterns in style, tone, formatting, structure, copywriting techniques, calls to action, topics, audience targeting, and other relevant factors.
Provide a deep, nuanced breakdown of headlines and hooks/intros, especially for the highest‐performing posts, explaining what makes them compelling or effective.
Identify which patterns, tactics, and writing strategies correlate with higher engagement.
Explain your reasoning with specific examples, referencing the particular post(s) that illustrate each point.
Compare and contrast the top‐performing posts with those that are at the lower end within these 20, to highlight the differences in approach or execution.
Offer actionable, detailed, and evidence-based improvements for future posts—focusing on style, tone, formatting, copywriting, topic selection, audience engagement, and especially headline/hook strategies.
Provide at least 5 specific, immediately implementable recommendations, each backed by rationale and potential impact.

Preferred Response Structure
Please organize your analysis with clear headings:

High-Level Themes & Observations

Summarize overall impressions and broad trends noticed across the dataset.
Detailed Pattern Analysis

2.1 Style & Tone
2.2 Formatting & Structure
2.3 Copywriting & Persuasion Tactics
2.4 Topic & Content Strategy
2.5 Audience Engagement Factors
Headline & Hook Analysis

Discuss the specific qualities of the top‐performing headlines (e.g., emotional words, curiosity gaps, clarity vs. mystery, etc.).
Examine the first 2–3 lines (hooks) of the best‐performing posts to reveal patterns in how they capture attention.
Provide examples (e.g., "Post #3's headline uses a surprising statistic…").
Explain why certain headlines or hooks are more compelling.
Key Drivers of High Engagement

Correlate strategies (e.g., strong storytelling, personal anecdotes, controversy, etc.) with high metrics.
Cite the top posts that exemplify these drivers.
Comparative Insights

Contrast the top‐performing posts with those that performed less well among these 20.
Address potential reasons for the disparities in style, topic, or formatting.
Actionable Recommendations

Provide at least 5 immediately implementable suggestions, with context on expected impact.
Include at least 1–2 recommendations specific to headline writing and hook development.
Potential Experiments & Next Steps

Suggest A/B testing ideas, new angles or topic experiments, advanced analytics, or new call-to-action methods.
Concise Summary

A quick recap of the top 3–5 takeaways the creator should prioritize.

DATASET:

${formattedPosts}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-specdec',
      temperature: temperature
    });

    return NextResponse.json({
      success: true,
      analysis: completion.choices[0]?.message?.content || 'No analysis generated'
    });

  } catch (error) {
    console.error('Error in Groq analysis:', error);
    return NextResponse.json(
      { error: 'Failed to analyze posts' },
      { status: 500 }
    );
  }
} 