"use client";

import { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
  
  // Use refs to track initialization and prevent race conditions
  const isInitializing = useRef(true);
  const lastActivity = useRef(Date.now());
  const sessionCheckInterval = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);

  // Safe state updates for specific types
  const safeSetUser = useCallback((value: User | null) => {
    if (mountedRef.current) {
      setUser(value);
    }
  }, []);

  const safeSetSession = useCallback((value: Session | null) => {
    if (mountedRef.current) {
      setSession(value);
    }
  }, []);

  const safeSetProfile = useCallback((value: UserProfile | null) => {
    if (mountedRef.current) {
      setProfile(value);
    }
  }, []);

  const safeSetLoading = useCallback((value: boolean) => {
    if (mountedRef.current) {
      setIsLoading(value);
    }
  }, []);

  const safeSetInitialized = useCallback((value: boolean) => {
    if (mountedRef.current) {
      setIsInitialized(value);
    }
  }, []);

  // Fetch user profile with retry
  const fetchProfile = useCallback(async (userId: string, retryCount = 0) => {
    if (!userId || retryCount > 3) {
      safeSetProfile(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (retryCount < 3) {
          // Exponential backoff retry
          setTimeout(() => {
            fetchProfile(userId, retryCount + 1);
          }, Math.pow(2, retryCount) * 1000);
          return;
        }
        throw error;
      }
      
      if (mountedRef.current && data) {
        safeSetProfile(data);
      } else {
        safeSetProfile(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (mountedRef.current) {
        safeSetProfile(null);
      }
    }
  }, [safeSetProfile]);

  // Initialize auth state
  useEffect(() => {
    mountedRef.current = true;
    let cleanup: (() => void) | undefined;

    const initializeAuth = async () => {
      if (!isInitializing.current) return;
      
      try {
        safeSetLoading(true);
        // Get initial session and try to refresh it
        const { data: { session: initialSession }, error: initialError } = await supabase.auth.getSession();
        
        if (!mountedRef.current) return;
        
        if (initialError) throw initialError;

        let currentSession = initialSession;

        // Try to refresh the session if we have one
        if (initialSession) {
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          if (!refreshError && refreshedSession) {
            currentSession = refreshedSession;
          }
        }

        if (currentSession?.user) {
          safeSetSession(currentSession);
          safeSetUser(currentSession.user);
          await fetchProfile(currentSession.user.id);
        } else {
          safeSetSession(null);
          safeSetUser(null);
          safeSetProfile(null);
        }

        // Start session check with shorter interval
        const checkSession = setInterval(async () => {
          if (!mountedRef.current) return;
          
          const now = Date.now();
          const inactiveTime = now - lastActivity.current;

          // Check session every minute
          if (inactiveTime > 60 * 1000) {
            // Try to refresh the session first
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError || !refreshedSession) {
              // If refresh fails, check current session
              const { data: { session: currentSession } } = await supabase.auth.getSession();
              if (!currentSession && user) {
                safeSetSession(null);
                safeSetUser(null);
                safeSetProfile(null);
                router.replace('/login');
              }
            } else {
              // Update session state with refreshed session
              safeSetSession(refreshedSession);
              safeSetUser(refreshedSession.user);
              await fetchProfile(refreshedSession.user.id);
            }
            lastActivity.current = now;
          }
        }, 60 * 1000); // Check every minute

        sessionCheckInterval.current = checkSession;
        cleanup = () => clearInterval(checkSession);
        
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mountedRef.current) {
          safeSetUser(null);
          safeSetSession(null);
          safeSetProfile(null);
        }
      } finally {
        if (mountedRef.current) {
          safeSetLoading(false);
          safeSetInitialized(true);
          isInitializing.current = false;
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mountedRef.current) return;

        try {
          console.log('AuthContext: Auth state change event:', {
            event,
            hasSession: !!currentSession,
            userId: currentSession?.user?.id,
            mountedRef: mountedRef.current
          });
          
          safeSetLoading(true);
          lastActivity.current = Date.now();

          // Always try to refresh the session on auth state change
          let validSession = currentSession;
          if (currentSession) {
            console.log('AuthContext: Attempting to refresh session');
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
            if (!refreshError && refreshedSession) {
              console.log('AuthContext: Session refreshed successfully');
              validSession = refreshedSession;
            } else if (refreshError) {
              console.error('AuthContext: Session refresh error:', refreshError);
            }
          }
          
          safeSetSession(validSession);
          safeSetUser(validSession?.user ?? null);

          if (validSession?.user) {
            console.log('AuthContext: Fetching profile for user:', validSession.user.id);
            await fetchProfile(validSession.user.id);
          } else {
            console.log('AuthContext: No valid session, clearing profile');
            safeSetProfile(null);
          }

          // Handle navigation after auth state changes
          if (event === 'SIGNED_IN') {
            console.log('AuthContext: SIGNED_IN event, redirecting to dashboard');
            router.refresh();
            await router.replace('/dashboard');
            console.log('AuthContext: Dashboard redirect complete');
          } else if (event === 'SIGNED_OUT') {
            console.log('AuthContext: SIGNED_OUT event, redirecting to login');
            router.refresh();
            await router.replace('/login');
            console.log('AuthContext: Login redirect complete');
          }
        } catch (error) {
          console.error('AuthContext: Auth state change error:', error);
        } finally {
          if (mountedRef.current) {
            safeSetLoading(false);
          }
        }
      }
    );

    return () => {
      mountedRef.current = false;
      if (cleanup) cleanup();
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
      subscription.unsubscribe();
    };
  }, [fetchProfile, router, safeSetUser, safeSetSession, safeSetProfile, safeSetLoading, safeSetInitialized, user, session]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!mountedRef.current) return;
      
      if (document.visibilityState === 'visible') {
        lastActivity.current = Date.now();
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession?.user) {
          safeSetSession(currentSession);
          safeSetUser(currentSession.user);
          await fetchProfile(currentSession.user.id);
        } else if (session) {
          safeSetSession(null);
          safeSetUser(null);
          safeSetProfile(null);
          router.replace('/login');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchProfile, router, session, safeSetUser, safeSetSession, safeSetProfile]);

  const signOut = useCallback(async () => {
    try {
      safeSetLoading(true);
      await supabase.auth.signOut();
      safeSetUser(null);
      safeSetSession(null);
      safeSetProfile(null);
      router.refresh();
      await router.replace('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    } finally {
      safeSetLoading(false);
    }
  }, [router, safeSetLoading, safeSetUser, safeSetSession, safeSetProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      console.log('AuthContext: Starting sign in process');
      safeSetLoading(true);

      // First check if we have a valid client
      if (!supabase) {
        console.error('AuthContext: Supabase client not initialized');
        throw new Error('Supabase client not initialized');
      }

      console.log('AuthContext: Making sign in request');
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password,
      });
      
      console.log('AuthContext: Sign in response:', {
        hasData: !!data,
        hasError: !!error,
        hasSession: !!data?.session,
        hasUser: !!data?.user,
        errorMessage: error?.message,
        userId: data?.user?.id
      });
      
      if (error) {
        console.error('AuthContext: Sign in error:', error);
        throw error;
      }

      // If successful, update the session and redirect
      if (data.session) {
        console.log('AuthContext: Updating session state');
        safeSetSession(data.session);
        safeSetUser(data.session.user);
        
        console.log('AuthContext: Fetching user profile');
        await fetchProfile(data.session.user.id);
        
        // Force a hard navigation to dashboard
        console.log('AuthContext: Forcing navigation to dashboard');
        window.location.href = '/dashboard';
        
        console.log('AuthContext: Sign in process complete');
      } else {
        console.error('AuthContext: No session in response data');
        throw new Error('No session returned from authentication');
      }

      return { error: null };
    } catch (error) {
      console.error('AuthContext: Sign in error:', error);
      return { 
        error: error instanceof Error 
          ? error 
          : new Error('Authentication failed. Please check your credentials.')
      };
    } finally {
      console.log('AuthContext: Setting loading to false');
      safeSetLoading(false);
    }
  }, [safeSetLoading, safeSetSession, safeSetUser, fetchProfile]);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      safeSetLoading(true);
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
      safeSetLoading(false);
    }
  }, [safeSetLoading]);

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
