"use client";

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../supabase/clients';
import { logoutUser, signInWithGoogle } from '../supabase/authUtils';
import { UserProfile } from '../supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Handle navigation based on auth state
  const handleAuthNavigation = useCallback(async (isAuthenticated: boolean) => {
    const isAuthRoute = ['/login', '/signup', '/reset-password'].includes(pathname || '');
    const isPublicRoute = ['/', '/about', '/contact'].includes(pathname || '');

    if (isAuthenticated) {
      if (isAuthRoute) {
        await router.push('/dashboard');
      }
    } else {
      if (!isAuthRoute && !isPublicRoute) {
        await router.push('/login');
      }
    }
    router.refresh();
  }, [pathname, router]);

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
        } else {
          setSession(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setSession(null);
        setUser(null);
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

        // Handle navigation after auth state changes
        if (event === 'SIGNED_IN') {
          await handleAuthNavigation(true);
        } else if (event === 'SIGNED_OUT') {
          await handleAuthNavigation(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [handleAuthNavigation]);

  // Route protection effect
  useEffect(() => {
    if (!isInitialized || isLoading) return;
    handleAuthNavigation(!!user);
  }, [user, isInitialized, isLoading, handleAuthNavigation]);

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

  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
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
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signOut,
    signInWithGoogle: handleGoogleSignIn
  }), [user, session, isLoading, signIn, signOut, handleGoogleSignIn]);

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
