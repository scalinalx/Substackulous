import { NextResponse } from 'next/server';
import { createClient, User } from '@supabase/supabase-js';

type SessionValidationResult = 
  | { sessionUser: User; error?: never; status?: never }
  | { sessionUser?: never; error: string; status: number };

export async function validateSession(req: Request): Promise<SessionValidationResult> {
  console.log('Auth Middleware: Starting session validation');
  
  // Get the session from the Authorization header
  const authHeader = req.headers.get('Authorization');
  console.log('Auth header present:', !!authHeader);
  
  if (!authHeader?.startsWith('Bearer ')) {
    console.error('No Authorization header or invalid format');
    return { error: 'Not authenticated', status: 401 };
  }

  const token = authHeader.split(' ')[1];
  console.log('Token length:', token.length);
  
  // Create Supabase client for auth
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    console.log('Attempting to get user with token...');
    // First try to get the user with the token
    const { data: { user: sessionUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError) {
      console.error('Auth error in validateSession:', {
        message: authError.message,
        status: authError.status
      });
      return { error: 'Not authenticated', status: 401 };
    }

    if (!sessionUser) {
      console.error('No user found for token');
      return { error: 'Not authenticated', status: 401 };
    }

    console.log('Successfully validated session for user:', sessionUser.id);
    // If we got here, the token is valid and we have a user
    return { sessionUser };

  } catch (error) {
    console.error('Unexpected error in validateSession:', error);
    return { error: 'Server error during authentication', status: 500 };
  }
}

// Helper to check if user has enough credits
export async function validateCredits(userId: string, requiredCredits: number) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  // Check if user has enough credits
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error('Profile query error:', profileError);
    return { error: 'Failed to fetch user profile', status: 404 };
  }

  if (!profile) {
    return { error: 'User profile not found', status: 404 };
  }

  if (profile.credits < requiredCredits) {
    return { error: 'Insufficient credits', status: 400 };
  }

  return { profile };
}

// Helper to deduct credits
export async function deductCredits(userId: string, creditCost: number) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    console.error('Error fetching profile for credit deduction:', profileError);
    return { error: 'Failed to update credits', status: 500 };
  }

  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ credits: profile.credits - creditCost })
    .eq('id', userId);

  if (updateError) {
    console.error('Failed to update credits:', updateError);
    return { error: 'Failed to update credits', status: 500 };
  }

  return { success: true };
} 