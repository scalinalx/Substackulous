import { NextResponse } from 'next/server';
import { createClient, User } from '@supabase/supabase-js';

type SessionValidationResult = 
  | { sessionUser: User; error?: never; status?: never }
  | { sessionUser?: never; error: string; status: number };

export async function validateSession(req: Request): Promise<SessionValidationResult> {
  // Get the session from the Authorization header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    console.error('No Authorization header');
    return { error: 'Not authenticated', status: 401 };
  }

  const token = authHeader.split(' ')[1];
  
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

  // Verify the token and get the user
  const { data: { user: sessionUser }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !sessionUser) {
    console.error('Auth error:', authError);
    return { error: 'Not authenticated', status: 401 };
  }

  return { sessionUser };
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