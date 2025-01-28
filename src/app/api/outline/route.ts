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
    
    try {
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

      console.log('Initial profile query result:', { profile, error: profileError });

      // If profile doesn't exist, create one
      if (!profile && profileError?.code === 'PGRST116') {
        console.log('Creating new profile for user:', userId);
        const { data: newProfile, error: createError } = await supabaseAdmin
          .from('profiles')
          .insert([
            {
              id: userId,
              email: sessionUser.email,
              credits: 100, // Initial credits
              created_at: new Date().toISOString(),
              last_login: new Date().toISOString()
            }
          ])
          .select()
          .single();

        if (createError) {
          console.error('Failed to create profile:', createError);
          return NextResponse.json({ 
            error: 'Failed to create user profile',
            details: createError.message 
          }, { status: 500 });
        }

        profile = newProfile;
        profileError = null;
      }

      if (profileError) {
        console.error('Profile query error:', profileError);
        return NextResponse.json({ 
          error: 'Failed to fetch user profile',
          details: profileError.message 
        }, { status: 404 });
      }

      if (!profile) {
        console.error('No profile found for user:', userId);
        return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
      }

      if (profile.credits < 2) {
        return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 });
      }

      // Call DeepSeek API with increased timeout
      const requestBody = {
        model: "deepseek-chat",
        messages: [{
          role: "user",
          content: prompt
        }],
        temperature: 0.7,
        max_tokens: 1200,
        top_p: 1.0
      };

      console.log('\n=== DeepSeek API Request ===');
      console.log('Prompt:', prompt);
      console.log('Full request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deepseekApiKey}`
        },
        body: JSON.stringify(requestBody),
        // Add timeout of 55 seconds
        signal: AbortSignal.timeout(55000)
      });

      const responseData = await response.text();
      let parsedData;
      
      try {
        parsedData = JSON.parse(responseData);
        console.log('\n=== DeepSeek API Response ===');
        console.log('Status:', response.status);
        console.log('Generated content:', parsedData.choices?.[0]?.message?.content || 'No content');
        console.log('Full response:', JSON.stringify(parsedData, null, 2));
      } catch (e) {
        console.error('Failed to parse DeepSeek response:', responseData);
        return NextResponse.json({ 
          error: 'Invalid response from AI service' 
        }, { status: 500 });
      }

      if (!response.ok || !parsedData.choices?.[0]?.message?.content) {
        console.error('DeepSeek error response:', parsedData);
        return NextResponse.json({ 
          error: parsedData.error?.message || 'Failed to generate content' 
        }, { status: response.status });
      }

      const generatedContent = parsedData.choices[0].message.content;

      // Update the credits using supabaseAdmin
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ credits: profile.credits - 2 })
        .eq('id', userId);

      if (updateError) {
        console.error('Failed to update credits:', updateError);
        return NextResponse.json({ 
          error: 'Failed to update credits' 
        }, { status: 500 });
      }

      return NextResponse.json({ content: generatedContent });

    } catch (error) {
      console.error('Error in outline generation:', error);
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in outline generation:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }, { status: 500 });
  }
} 