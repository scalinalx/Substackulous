// src/lib/supabase/authUtils.ts
import { AuthError, User } from '@supabase/supabase-js';
import { supabase } from './clients';

export interface AuthResponse {
  user: User | null;
  error: AuthError | null;
}

export async function signInWithGoogle(): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    return {
      user: null,
      error
    };
  } catch (error) {
    return {
      user: null,
      error: error as AuthError
    };
  }
}

export async function logoutUser(): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    return { error: error as AuthError };
  }
}

export async function getCurrentUser(): Promise<AuthResponse> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  } catch (error) {
    return {
      user: null,
      error: error as AuthError
    };
  }
}

export async function resetPassword(email: string): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });
    return { error };
  } catch (error) {
    return { error: error as AuthError };
  }
}

export async function updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    return { error };
  } catch (error) {
    return { error: error as AuthError };
  }
}