// src/lib/supabase/clients.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Check environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Debug environment variables
console.log('Supabase Client: Initializing with config:', {
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
    debug: true // Always enable debug for troubleshooting
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey
    }
  }
});

// Test the client initialization
supabaseClient.auth.onAuthStateChange((event, session) => {
  console.log('Supabase Client: Auth State Changed:', { 
    event, 
    hasSession: !!session,
    timestamp: new Date().toISOString(),
    accessToken: session?.access_token ? 'present' : 'none',
    userId: session?.user?.id
  });
});

// Test the connection
(async () => {
  try {
    console.log('Supabase Client: Testing connection...');
    const { data, error } = await supabaseClient.auth.getSession();
    console.log('Supabase Client: Initial session check:', {
      hasData: !!data,
      hasSession: !!data?.session,
      hasError: !!error,
      errorMessage: error?.message
    });
  } catch (err) {
    console.error('Supabase Client: Failed to check initial session:', err);
  }
})();

export default supabaseClient;
export const supabase = supabaseClient;