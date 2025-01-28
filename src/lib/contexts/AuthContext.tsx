"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase, UserProfile } from '../supabase';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  loading: boolean;
  error: string | null;
  updateProfile: (newProfile: UserProfile) => Promise<void>;
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
      
      // Always update the profile with the latest data from the database
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
    let mounted = true;

    async function initializeAuth() {
      try {
        // Check active sessions
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            // Fetch fresh profile data
            await fetchProfile(session.user.id);
          }
          setLoading(false);
        }

        // Listen for changes on auth state
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (mounted) {
            setUser(session?.user ?? null);
            if (session?.user) {
              // Fetch fresh profile data
              await fetchProfile(session.user.id);
            } else {
              setProfile(null);
            }
            setLoading(false);
          }
        });

        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
          setError('Failed to initialize authentication');
        }
      }
    }

    initializeAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push('/dashboard');
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      // First, create the user in Supabase Auth
      const { error: signUpError, data } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            credits: 100 // Initial credits for new users
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (signUpError) throw signUpError;

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
            // Don't throw the error as the user is already created
          }
        } catch (profileError) {
          console.error('Error in profile creation:', profileError);
          // Don't throw the error as the user is already created
        }
      }

      return {
        success: true,
        message: "Please check your email for a verification link. You must verify your email before accessing your account."
      };
    } catch (error) {
      setError((error as Error).message);
      return {
        success: false,
        message: (error as Error).message
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // First clear local state
      setUser(null);
      setProfile(null);
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Force a hard navigation to clear all state
      window.location.href = '/';
    } catch (error) {
      setError((error as Error).message);
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (newProfile: UserProfile) => {
    try {
      // Update the database first
      const { error } = await supabase
        .from('profiles')
        .update({
          credits: newProfile.credits,
          last_login: new Date().toISOString()
        })
        .eq('id', newProfile.id);

      if (error) throw error;

      // If database update successful, update local state
      setProfile(newProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
      // Refresh profile from database to ensure consistency
      if (user) {
        await fetchProfile(user.id);
      }
    }
  };

  const value = {
    user,
    profile,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    loading,
    error,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
