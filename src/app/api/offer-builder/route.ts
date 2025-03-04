import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, prompt } = await request.json();

    if (!userId || !prompt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify user has enough credits
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (userData.credits < 3) {
      return NextResponse.json({ error: 'Not enough credits' }, { status: 402 });
    }

    // Generate offer using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert in creating high-ticket offers that convert. Your task is to help Substack writers craft irresistible $50,000/month offers based on their input.

Follow these guidelines:
1. Create a comprehensive offer framework that feels premium and high-value
2. Focus on clear transformation and results
3. Structure the offer with a compelling value stack
4. Include pricing strategy that justifies the high price point
5. Provide objection handling scripts for common resistance points
6. Format everything in clean, well-structured markdown
7. Be specific and actionable - no generic advice`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    // Deduct credits
    const { error: updateError } = await supabase
      .from('users')
      .update({ credits: userData.credits - 3 })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating credits:', updateError);
      return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 });
    }

    // Log the generation
    await supabase
      .from('generation_logs')
      .insert({
        user_id: userId,
        generation_type: 'offer_builder',
        prompt: prompt,
        tokens_used: completion.usage?.total_tokens || 0,
        created_at: new Date().toISOString(),
      });

    return NextResponse.json({ content: completion.choices[0].message.content });
  } catch (error) {
    console.error('Error in offer-builder API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 