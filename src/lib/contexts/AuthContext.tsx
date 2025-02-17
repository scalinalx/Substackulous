"use client";

import { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';
import { supabase, withRetry } from '@/lib/supabase/clients';
import { logoutUser, signInWithGoogle, resetPassword as resetPasswordUtil } from '../supabase/authUtils';

interface UserProfile {
  id: string;
  email: string;
  credits: number;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  isInitialized: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  // Use refs to track initialization and prevent race conditions
  const isInitializing = useRef(true);
  const lastActivity = useRef(Date.now());
  const sessionCheckInterval = useRef<NodeJS.Timeout>();

  // Add these at the top with other imports
  const RETRY_DELAY = 1000; // 1 second
  const MAX_RETRIES = 3;

  // Fetch user profile
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      // Get current session to ensure we're authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active session when fetching profile');
        setProfile(null);
        return;
      }

      const query = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data, error } = await withRetry<UserProfile>(() => 
        Promise.resolve(query)
      );

      if (error) {
        console.error('Supabase error fetching profile:', error);
        throw error;
      }
      
      // Only update profile if it's different and data exists
      if (data && JSON.stringify(data) !== JSON.stringify(profile)) {
        setProfile(data as UserProfile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Don't set profile to null if we already have a profile and this is just a refresh error
      if (!profile) {
        setProfile(null);
      }
    }
  }, [profile]);

  // Check session status periodically
  const startSessionCheck = useCallback(() => {
    if (sessionCheckInterval.current) {
      clearInterval(sessionCheckInterval.current);
    }

    sessionCheckInterval.current = setInterval(async () => {
      const now = Date.now();
      const inactiveTime = now - lastActivity.current;

      // Increase check interval to 15 minutes instead of 5
      if (inactiveTime > 15 * 60 * 1000) {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log('sessionCheckInterval fired → currentSession:', currentSession);
        if (!currentSession && user) {
          // Session expired, reset state
          setSession(null);
          setUser(null);
          setProfile(null);
          router.replace('/login');
        }
        lastActivity.current = now;
      }
    }, 60 * 1000); // Check every minute instead of every 30 seconds

    return () => {
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
    };
  }, [router, user]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        lastActivity.current = Date.now();
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          await fetchProfile(currentSession.user.id);
        } else if (session) {
          // Session expired while away
          setSession(null);
          setUser(null);
          setProfile(null);
          router.replace('/login');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchProfile, router, session]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    let cleanup: (() => void) | undefined;

    const initializeAuth = async () => {
      try {
        if (!isInitializing.current) return;
        
        setIsLoading(true);
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();

        console.log('AuthContext init → initialSession:', initialSession);
        
        if (!mounted) return;
        
        if (error) throw error;

        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          await fetchProfile(initialSession.user.id);
        }

        // Start session check and store cleanup
        cleanup = startSessionCheck();
        
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
        setSession(null);
        setProfile(null);
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsInitialized(true);
          isInitializing.current = false;
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        try {
          setIsLoading(true);
          lastActivity.current = Date.now();
          
          // Only update if session actually changed
          if (JSON.stringify(currentSession) !== JSON.stringify(session)) {
            setSession(currentSession);
            setUser(currentSession?.user ?? null);

            if (currentSession?.user) {
              await fetchProfile(currentSession.user.id);
            } else {
              setProfile(null);
            }

            // Handle navigation after auth state changes
            if (event === 'SIGNED_IN') {
              router.replace('/dashboard');
            } else if (event === 'SIGNED_OUT') {
              router.replace('/login');
            }
          }
        } catch (error) {
          console.error('Auth state change error:', error);
        } finally {
          if (mounted) {
            setIsLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      if (cleanup) cleanup();
      subscription.unsubscribe();
    };
  }, [fetchProfile, router, startSessionCheck, session]);

  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      router.refresh();
      await router.replace('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { 
        error: error instanceof Error 
          ? error 
          : new Error('Authentication failed. Please check your credentials.')
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signUp({ email, password });
      
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { 
        error: error instanceof Error 
          ? error 
          : new Error('Failed to sign up. Please try again.')
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setIsLoading(true);
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (error) {
      console.error('Google sign in failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleResetPassword = useCallback(async (email: string) => {
    try {
      setIsLoading(true);
      const { error } = await resetPasswordUtil(email);
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { 
        error: error instanceof Error 
          ? error 
          : new Error('Failed to reset password. Please try again.')
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      setIsLoading(true);
      
      // Get the latest profile state first
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Merge current profile with updates
      const mergedUpdates = {
        ...currentProfile,
        ...updates,
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(mergedUpdates)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update local state with merged updates
      setProfile(mergedUpdates);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      // Reset loading state even on error
      setIsLoading(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const contextValue = useMemo(() => ({
    user,
    session,
    profile,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    signInWithGoogle: handleGoogleSignIn,
    resetPassword: handleResetPassword,
    updateProfile,
    isInitialized
  }), [user, session, profile, isLoading, isInitialized, signIn, signUp, signOut, handleGoogleSignIn, handleResetPassword, updateProfile]);

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
