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
      flowType: 'implicit',
      // Only enable debug in development environment
      debug: process.env.NODE_ENV === 'development',
      // Set a shorter storage key to reduce chance of corruption
      storageKey: 'sb-auth-token',
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

// Track session initialization attempts to prevent infinite loops
let sessionInitAttempts = 0;
const MAX_SESSION_INIT_ATTEMPTS = 3;

// Add error event listener
supabaseClient.auth.onAuthStateChange((event, session) => {
  console.log('Auth state change event:', event, session ? 'Session exists' : 'No session');
  
  // Reset counter on successful auth events
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    sessionInitAttempts = 0;
  }
  
  if (event === 'SIGNED_OUT') {
    // Clear auth-related localStorage to prevent stale data
    clearAuthStorage();
  }
});

// Helper function to clear all Supabase auth-related storage items
export const clearAuthStorage = () => {
  if (typeof window === 'undefined') return;
  
  try {
    // Delete all supabase cache
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    }
    
    // Also clear the new shorter key if it exists
    localStorage.removeItem('sb-auth-token');
    
    // Clear any session cookies
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.trim().split('=');
      if (name.includes('sb-')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      }
    });
    
    console.log('Auth storage cleared successfully');
  } catch (err) {
    console.error('Error clearing auth storage:', err);
  }
};

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
      
      // Only retry on resource errors or network issues
      if (!lastError.message?.includes('insufficient') && 
          !lastError.message?.includes('rate limit') &&
          !lastError.message?.includes('network') &&
          !lastError.message?.includes('timeout')) {
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

// Helper function to check if we should attempt to fetch profile
export const shouldFetchProfile = () => {
  sessionInitAttempts++;
  return sessionInitAttempts <= MAX_SESSION_INIT_ATTEMPTS;
};

// Helper function to force a clean session recovery
export const forceSessionRecovery = async () => {
  try {
    // First clear all storage
    clearAuthStorage();
    
    // Then try to get a fresh session
    const { data, error } = await supabaseClient.auth.getSession();
    
    if (error) {
      console.error('Error in force session recovery:', error);
      return false;
    }
    
    return !!data.session;
  } catch (err) {
    console.error('Exception in forceSessionRecovery:', err);
    return false;
  }
};