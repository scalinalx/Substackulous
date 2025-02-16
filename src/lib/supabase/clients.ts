// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

console.log('Initializing Supabase client');

// Create a single instance of the Supabase client
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  }
);

console.log('Supabase client initialized');

// Export a function that always returns the same instance
export const getSupabaseClient = () => supabaseClient;

// Export the client directly for backward compatibility
export const supabase = supabaseClient;