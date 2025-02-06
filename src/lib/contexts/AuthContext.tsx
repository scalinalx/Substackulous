"use client";

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase } from '../supabase/clients';
import { logoutUser } from '../supabase/authUtils';
import { UserProfile } from '../supabase';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  loading: boolean;
  error: string | null;
  updateProfile: (newProfile: UserProfile) => Promise<void>;
  updateUserCredits: (userId: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      if (data) {
        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!mounted) return;
        setUser(user);
        if (user) {
          // Fetch user profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileError) throw profileError;
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return;
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          // Fetch user profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('Error fetching profile:', profileError);
            return;
          }

          setProfile(profile);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          router.push('/');
        }
      }
    );

    return () => {
      mounted = false;
      controller.abort();
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred during sign in');
      throw error;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const { error, data } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            credits: 100 // Initial credits for new users
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) throw error;

      // Only create profile if user was created successfully
      if (data.user) {
        try {
          // Wait a short moment to ensure the user is fully created in Auth
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Create profile record
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: data.user.id,
                email: data.user.email,
                credits: 100,
                created_at: new Date().toISOString(),
                last_login: new Date().toISOString()
              }
            ]);

          if (profileError) {
            console.error('Error creating profile:', profileError);
          }
        } catch (profileError) {
          console.error('Error in profile creation:', profileError);
        }
      }

      return {
        success: true,
        message: "Please check your email for a verification link. You must verify your email before accessing your account."
      };
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred during sign up');
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred during sign up'
      };
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await logoutUser();
      setUser(null);
      setProfile(null);
      setError(null);
      // Clear any remaining auth state
      window.dispatchEvent(new Event('local-storage'));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Logout failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred during Google sign in');
      throw error;
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) throw error;
      
      return {
        success: true,
        message: "Password reset instructions have been sent to your email."
      };
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred during password reset');
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred during password reset'
      };
    }
  }, []);

  const updateProfile = useCallback(async (newProfile: UserProfile) => {
    setError(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(newProfile)
        .eq('id', newProfile.id);

      if (error) throw error;

      setProfile(newProfile);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred while updating profile');
      throw error;
    }
  }, []);

  const updateUserCredits = useCallback(async (userId: string) => {
    setError(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      const updatedProfile = {
        ...data,
        credits: data.credits
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updatedProfile)
        .eq('id', userId);

      if (updateError) throw updateError;

      setProfile(updatedProfile);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred while updating user credits');
      throw error;
    }
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    profile,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resetPassword,
    loading,
    error,
    updateProfile,
    updateUserCredits
  }), [user, profile, loading, error, signIn, signUp, signOut, signInWithGoogle, resetPassword, updateProfile, updateUserCredits]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
