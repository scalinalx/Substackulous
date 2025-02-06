// src/lib/supabase/authUtils.ts
import { supabase } from './clients';

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  });

  return { data, error };
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export function getCurrentUser() {
  return supabase.auth.getUser();
}