// src/lib/supabase/clients.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Check environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Debug environment variables
console.log('Supabase Environment Check:', {
  url: supabaseUrl?.substring(0, 10) + '...',
  hasUrl: !!supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  urlLength: supabaseUrl?.length || 0,
  anonKeyLength: supabaseAnonKey?.length || 0,
  isDevelopment: process.env.NODE_ENV === 'development'
});

if (!supabaseUrl) {
  console.error('CRITICAL: Missing NEXT_PUBLIC_SUPABASE_URL');
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  console.error('CRITICAL: Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

console.log('Initializing Supabase client...');

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
      debug: true
    },
    global: {
      headers: {
        'apikey': supabaseAnonKey
      }
    }
  }
);

// Test the client initialization
supabaseClient.auth.onAuthStateChange((event, session) => {
  console.log('Supabase Auth State Changed:', { 
    event, 
    hasSession: !!session,
    timestamp: new Date().toISOString()
  });
});

// Test the connection
(async () => {
  try {
    const { data, error } = await supabaseClient.auth.getSession();
    console.log('Initial Supabase session check:', {
      hasData: !!data,
      hasSession: !!data?.session,
      hasError: !!error,
      errorMessage: error?.message
    });
  } catch (err) {
    console.error('Failed to check initial Supabase session:', err);
  }
})();

console.log('Supabase client initialized');

export default supabaseClient;
export const supabase = supabaseClient;