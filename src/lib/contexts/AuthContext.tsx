"use client";

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/clients';
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

  // Fetch user profile
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    }
  }, []);

  // Handle navigation based on auth state
  const handleAuthNavigation = useCallback(async (isAuthenticated: boolean) => {
    if (!isInitialized) return;

    const isAuthRoute = ['/login', '/signup', '/reset-password'].includes(pathname || '');
    const isPublicRoute = ['/', '/about', '/contact'].includes(pathname || '');
    const isDashboardRoute = pathname?.startsWith('/dashboard');

    if (isAuthenticated) {
      if (isAuthRoute) {
        await router.replace('/dashboard');
      }
    } else {
      if (isDashboardRoute) {
        await router.replace('/login');
      }
    }
  }, [pathname, router, isInitialized]);

  // Handle auth state initialization and changes
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (!isMounted) return;
        
        if (error) throw error;

        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          await fetchProfile(initialSession.user.id);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id);
        } else {
          setProfile(null);
        }

        // Handle navigation after auth state changes
        if (event === 'SIGNED_IN') {
          await handleAuthNavigation(true);
        } else if (event === 'SIGNED_OUT') {
          await handleAuthNavigation(false);
        }

        setIsLoading(false);
        setIsInitialized(true);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, handleAuthNavigation]);

  // Route protection effect
  useEffect(() => {
    if (!isInitialized) return;
    handleAuthNavigation(!!user);
  }, [user, isInitialized, handleAuthNavigation]);

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

  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      await router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

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
