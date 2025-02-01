export const runtime = 'edge';
export const maxDuration = 300;

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Check for required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
}

if (!process.env.DEEPSEEK_API_KEY) {
  throw new Error('DEEPSEEK_API_KEY is not set');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const deepseekApiKey = process.env.DEEPSEEK_API_KEY;

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
  const timeoutId = setTimeout(() => controller.abort(), 240000); // 4 minute timeout for DeepSeek API

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

    // Call DeepSeek API
    console.log('Calling DeepSeek API with timeout of 4 minutes...');
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekApiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{
          role: "user",
          content: prompt
        }],
        temperature: 0.7,
        max_tokens: 1200,
        top_p: 1.0,
        timeout: 230 // Add explicit timeout in seconds for DeepSeek
      }),
      signal: controller.signal
    });

    console.log('DeepSeek API response status:', response.status);
    const responseText = await response.text();
    console.log('Raw response text:', responseText);

    if (!response.ok) {
      return NextResponse.json({ error: responseText }, { status: response.status });
    }

    let data;
    try {
      data = JSON.parse(responseText);
      console.log('Parsed response data:', data);
    } catch (error) {
      console.error('Error parsing response:', error);
      return NextResponse.json({ error: 'Invalid JSON response from AI service' }, { status: 500 });
    }

    const outline = data.choices[0]?.message?.content;

    if (!outline) {
      console.error('No outline in response:', data);
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

    // Handle fetch errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      return NextResponse.json({
        error: 'Failed to connect to the AI service',
        details: 'The service may be temporarily unavailable.'
      }, { status: 503 });
    }

    return NextResponse.json({
      error: 'An unexpected error occurred',
      details: error.message || 'No additional details available'
    }, { status: 500 });
  } finally {
    clearTimeout(timeoutId);
  }
} 