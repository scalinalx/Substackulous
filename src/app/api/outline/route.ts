export const runtime = 'edge';
export const maxDuration = 300;

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Check for required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
}

if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY is not set');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const groqApiKey = process.env.GROQ_API_KEY;

// Initialize Groq client
const groq = new Groq({ apiKey: groqApiKey });

// Client for authentication
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Admin client for database operations that bypass RLS
const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(req: Request) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 240000); // 4 minute timeout

  try {
    const { userId, prompt } = await req.json();
    console.log('Received request with userId:', userId);

    if (!userId || !prompt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the session from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('No Authorization header');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the token and get the user
    const { data: { user: sessionUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !sessionUser) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (sessionUser.id !== userId) {
      console.error('User ID mismatch:', { sessionUserId: sessionUser.id, requestUserId: userId });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // First, check if user has enough credits
    let { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Profile query error:', profileError);
      return NextResponse.json({ 
        error: 'Failed to fetch user profile',
        details: profileError.message 
      }, { status: 404 });
    }

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    if (profile.credits < 2) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 });
    }

    console.log('Calling Groq API...');
    const completion = await groq.chat.completions.create({
      messages: [{
        role: "user",
        content: prompt
      }],
      model: "deepseek-r1-distill-llama-70b",
      temperature: 0.69,
      max_tokens: 4096,
      top_p: 0.95,
      stream: false, // We'll handle streaming in a future update
      stop: null
    });

    console.log('Groq API response received');
    const outline = completion.choices[0]?.message?.content;

    if (!outline) {
      console.error('No outline in response:', completion);
      return NextResponse.json({ error: 'No outline generated' }, { status: 500 });
    }

    // Update the credits using supabaseAdmin
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ credits: profile.credits - 2 })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to update credits:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update credits',
        details: updateError.message 
      }, { status: 500 });
    }

    console.log('Successfully generated outline and updated credits');
    return NextResponse.json({ content: outline });
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('Error in API route:', error);
    
    if (error.name === 'AbortError') {
      return NextResponse.json({ 
        error: 'The request timed out. Please try again.',
        details: 'The AI service took too long to respond.'
      }, { status: 504 });
    }

    // Handle Groq specific errors
    if (error.status === 429) {
      return NextResponse.json({
        error: 'Rate limit exceeded',
        details: 'Please try again in a few moments.'
      }, { status: 429 });
    }

    return NextResponse.json({
      error: 'An unexpected error occurred',
      details: error.message || 'No additional details available'
    }, { status: error.status || 500 });
  } finally {
    clearTimeout(timeoutId);
  }
} 