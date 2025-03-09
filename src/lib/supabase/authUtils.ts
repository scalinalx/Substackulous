// src/lib/supabase/authUtils.ts
import { AuthError, User } from '@supabase/supabase-js';
import { supabase } from './clients';

export interface AuthResponse {
  user: User | null;
  error: AuthError | null;
}

export async function signInWithGoogle(): Promise<{ user: User | null, error: AuthError | null }> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
    return {
      user: null, // OAuth redirects, so we won't have user data here
      error: null
    };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    return {
      user: null,
      error: error as AuthError
    };
  }
}

export async function logoutUser(): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error signing out:', error);
    return { error: error as AuthError };
  }
}

export async function getCurrentUser(): Promise<AuthResponse> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { user, error };
  } catch (error) {
    console.error('Error getting current user:', error);
    return {
      user: null,
      error: error as AuthError
    };
  }
}

export async function resetPassword(email: string): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    if (error) throw error;
    return { error };
  } catch (error) {
    console.error('Error resetting password:', error);
    return { error: error as AuthError };
  }
}

export async function updatePassword(password: string): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: password,
    });
    if (error) throw error;
    return { error };
  } catch (error) {
    console.error('Error updating password:', error);
    return { error: error as AuthError };
  }
}

export async function signUp(email: string, password: string): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    });
    
    return { error };
  } catch (error) {
    console.error('Error during sign up:', error);
    return { error: error as AuthError };
  }
}