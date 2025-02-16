// src/lib/supabase/clients.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Check environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase environment check:', {
  hasUrl: !!supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  urlLength: supabaseUrl?.length,
  anonKeyLength: supabaseAnonKey?.length
});

if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!supabaseAnonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

console.log('Initializing Supabase client with URL:', supabaseUrl);

// Create a single instance of the Supabase client
const supabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      debug: true // Enable debug mode
    }
  }
);

// Test the client
supabaseClient.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth state changed:', { event, hasSession: !!session });
});

console.log('Supabase client initialized successfully');

// Export a function that always returns the same instance
export const getSupabaseClient = () => supabaseClient;

// Export the client directly for backward compatibility
export default supabaseClient;
export const supabase = supabaseClient;