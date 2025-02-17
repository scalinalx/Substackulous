// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Create a single instance of the Supabase client
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-my-custom-header': 'my-app-name',
      },
    },
  }
);

// Add error event listener
supabaseClient.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    // Delete all supabase cache
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    }
  }
});

// Create a wrapper function for Supabase queries with retry logic
export const withRetry = async <T>(
  operation: () => Promise<PostgrestSingleResponse<T>>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<PostgrestSingleResponse<T>> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await operation();
      // Convert Supabase error to standard error if needed
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result;
    } catch (error) {
      lastError = error as Error;
      
      // Only retry on resource errors
      if (!lastError.message?.includes('insufficient') && 
          !lastError.message?.includes('rate limit')) {
        throw error;
      }
      
      // Add increasing delay between retries
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => 
          setTimeout(resolve, delayMs * Math.pow(2, attempt))
        );
      }
    }
  }
  
  throw lastError!;
};

// Export a function that always returns the same instance
export const getSupabaseClient = () => supabaseClient;

// Export the client directly for backward compatibility
export const supabase = supabaseClient;