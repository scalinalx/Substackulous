// src/lib/supabase/clients.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Check environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Debug environment variables
console.log('Supabase Environment Check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlLength: supabaseUrl?.length || 0,
  anonKeyLength: supabaseAnonKey?.length || 0,
  isDevelopment: process.env.NODE_ENV === 'development'
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    `Missing Supabase environment variables:\n` +
    `NEXT_PUBLIC_SUPABASE_URL: ${!!supabaseUrl}\n` +
    `NEXT_PUBLIC_SUPABASE_ANON_KEY: ${!!supabaseAnonKey}`
  );
}

// Create a single instance of the Supabase client
const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase.auth.token',
    debug: process.env.NODE_ENV === 'development'
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey
    }
  },
  db: {
    schema: 'public'
  }
});

// Log successful initialization
console.log('Supabase client initialized with URL:', supabaseUrl);

// Test the client initialization
supabaseClient.auth.onAuthStateChange((event, session) => {
  console.log('Auth State Changed:', { 
    event, 
    hasSession: !!session,
    timestamp: new Date().toISOString(),
    accessToken: session?.access_token ? 'present' : 'none'
  });
});

// Test the connection
(async () => {
  try {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) {
      console.error('Failed to get initial Supabase session:', error);
    }
  } catch (err) {
    console.error('Failed to check initial Supabase session:', err);
  }
})();

export default supabaseClient;
export const supabase = supabaseClient;