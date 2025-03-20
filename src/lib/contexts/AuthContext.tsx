"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { useRouter, usePathname } from "next/navigation";
import { 
  supabase, 
  withRetry, 
  shouldFetchProfile,
  clearAuthStorage,
  forceSessionRecovery
} from "@/lib/supabase/clients";
import {
  logoutUser,
  signInWithGoogle,
  resetPassword as resetPasswordUtil,
  signUp as signUpUtil,
} from "../supabase/authUtils";

// Auth loading timeout - prevents infinite loading (15 seconds)
const AUTH_LOADING_TIMEOUT = 15000;

interface UserProfile {
  id: string;
  email: string;
  // credits: number;  <-- REMOVE credits from here
  created_at?: string;
  updated_at?: string;
}

// Add credits to the context type
interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  credits: number | null; // Add credits as a separate state
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  isInitialized: boolean;
  updateCredits: (newCredits: number) => Promise<void>;
  recoverSession: () => Promise<boolean>; // Add new recovery function
  recordUsage: (action: string, credits_consumed: number) => Promise<{ success: boolean; error?: string }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [credits, setCredits] = useState<number | null>(null); // Separate credits state
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const isInitializing = useRef(true);
  const lastActivity = useRef(Date.now());
  const sessionCheckInterval = useRef<NodeJS.Timeout>();
  const authLoadingTimeout = useRef<NodeJS.Timeout>();

  const RETRY_DELAY = 1000; // 1 second
  const MAX_RETRIES = 3;

  const fetchProfile = useCallback(async (userId: string) => {
        try {
            // Check if we should attempt to fetch the profile
            if (!shouldFetchProfile()) {
                console.warn('Maximum profile fetch attempts reached, aborting to prevent infinite loop');
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                console.error('No active session when fetching profile');
                setProfile(null);
                setCredits(null); // Also reset credits
                return;
            }

            const query = supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            const { data, error } = await withRetry<any>(() => // Use any for now
                Promise.resolve(query)
            );

            if (error) {
                console.error('Supabase error fetching profile:', error);
                throw error;
            }

          if (data) {
            // Separate profile data and credits
            const { credits: fetchedCredits, ...profileData } = data; // Destructure
            if (JSON.stringify(profileData) !== JSON.stringify(profile)) { // Important comparison
                setProfile(profileData); // Update profile *without* credits
            }
            if (fetchedCredits !== credits) {
               setCredits(fetchedCredits); // Update credits separately
            }
          }

        } catch (error) {
            console.error('Error fetching profile:', error);
            if (!profile) {
                setProfile(null);
                setCredits(null); // Also reset credits
            }
        }
    }, [profile, credits]); // Remove supabase from dependencies

  // New function to recover from a stuck auth state - MOVED UP BEFORE IT'S USED
  const recoverSession = useCallback(async () => {
    try {
      console.log('Attempting to recover session...');
      setIsLoading(true);
      
      // Clear all auth storage to start fresh
      clearAuthStorage();
      
      // Try to get a fresh session
      const success = await forceSessionRecovery();
      
      // If successful, get the session and user again
      if (success) {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          setSession(data.session);
          setUser(data.session.user);
          if (data.session.user) {
            await fetchProfile(data.session.user.id);
          }
          return true;
        }
      }
      
      // If recovery failed, redirect to login
      setUser(null);
      setSession(null);
      setProfile(null);
      setCredits(null);
      router.replace('/login');
      return false;
    } catch (error) {
      console.error('Session recovery failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [router, fetchProfile]);

    const startSessionCheck = useCallback(() => {
    if (sessionCheckInterval.current) {
      clearInterval(sessionCheckInterval.current);
    }

    sessionCheckInterval.current = setInterval(async () => {
      const now = Date.now();
      const inactiveTime = now - lastActivity.current;

      if (inactiveTime > 15 * 60 * 1000) {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log('sessionCheckInterval fired → currentSession:', currentSession);
        if (!currentSession && user) {
          // Session expired, reset state
          setSession(null);
          setUser(null);
          setProfile(null);
          setCredits(null);
          router.replace('/login');
        }
        lastActivity.current = now;
      }
    }, 60 * 1000); // Check every minute

    return () => {
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
    };
  }, [router, user]);

    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible') {
                lastActivity.current = Date.now();
                try {
                    const { data: { session: currentSession } } = await supabase.auth.getSession();

                    if (currentSession) {
                        setSession(currentSession);
                        setUser(currentSession.user);
                        await fetchProfile(currentSession.user.id);
                    } else if (session) {
                        // Session was lost, clear state and redirect
                        setSession(null);
                        setUser(null);
                        setProfile(null);
                        setCredits(null);
                        router.replace('/login');
                    }
                } catch (error) {
                    console.error('Error during visibility change session check:', error);
                    // If there's an error, attempt recovery
                    await recoverSession();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [fetchProfile, router, session, recoverSession]);

    useEffect(() => {
        let mounted = true;
        let cleanup: (() => void) | undefined;

        const initializeAuth = async () => {
            try {
                if (!isInitializing.current) return;

                setIsLoading(true);
                
                // Set a timeout to prevent infinite loading state
                if (authLoadingTimeout.current) {
                    clearTimeout(authLoadingTimeout.current);
                }
                
                authLoadingTimeout.current = setTimeout(() => {
                    if (isLoading && isInitializing.current) {
                        console.warn('Auth initialization timed out, attempting recovery...');
                        recoverSession().then(success => {
                            if (!success && mounted) {
                                // If recovery fails, force reset the state
                                setIsLoading(false);
                                setIsInitialized(true);
                                isInitializing.current = false;
                                router.replace('/login');
                            }
                        });
                    }
                }, AUTH_LOADING_TIMEOUT);
                
                const { data: { session: initialSession }, error } = await supabase.auth.getSession();

                console.log('AuthContext init → initialSession:', initialSession);

                if (!mounted) return;

                if (error) throw error;

                if (initialSession) {
                    setSession(initialSession);
                    setUser(initialSession.user);
                    
                    // Only fetch profile if we have a user and we haven't exceeded the maximum attempts
                    if (initialSession.user) {
                        await fetchProfile(initialSession.user.id);
                    }
                }
                cleanup = startSessionCheck();
            } catch (error) {
                console.error('Auth initialization error:', error);
                // On error, try to recover the session
                const recovered = await recoverSession();
                if (!recovered) {
                    setUser(null);
                    setSession(null);
                    setProfile(null);
                    setCredits(null);
                }
            } finally {
                if (mounted) {
                    setIsLoading(false);
                    setIsInitialized(true);
                    isInitializing.current = false;
                    
                    // Clear the timeout if initialization completes
                    if (authLoadingTimeout.current) {
                        clearTimeout(authLoadingTimeout.current);
                    }
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

                    console.log('Auth state change event:', event);

                    if (JSON.stringify(currentSession) !== JSON.stringify(session)) {
                        setSession(currentSession);
                        setUser(currentSession?.user ?? null);

                        if (currentSession?.user) {
                            await fetchProfile(currentSession.user.id);
                        } else {
                            setProfile(null);
                            setCredits(null);
                        }

                        if (event === 'SIGNED_IN') {
                            router.replace('/dashboard');
                        } else if (event === 'SIGNED_OUT') {
                            // Ensure we clear all auth data
                            clearAuthStorage();
                            router.replace('/login');
                        } else if (event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
                            // Just update the state, no redirect needed
                            console.log('User updated or token refreshed successfully');
                        }
                    }
                } catch (error) {
                    console.error('Auth state change error:', error);
                    // Try to recover on auth state change errors
                    await recoverSession();
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
            
            // Clear the timeout on unmount
            if (authLoadingTimeout.current) {
                clearTimeout(authLoadingTimeout.current);
            }
        };
    }, [fetchProfile, router, startSessionCheck, session, recoverSession]);

    const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setCredits(null);
      router.refresh();
      await router.replace('/');
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
            const { error } = await signUpUtil(email, password);
            return { error };
        } catch (error) {
            console.error('Sign up error:', error);
            return { error: error as Error };
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

    // Keep the original updateProfile, but modify it to *not* update credits.
    const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
        console.log("updateProfile: STARTING, updates:", updates);
        if (!user) throw new Error('No user logged in');

        try {
            setIsLoading(true);
            console.log("updateProfile: Fetching current profile from Supabase...");

            // Fetch *only* the non-credit profile data.
            const { data: currentProfile, error: fetchError } = await supabase
                .from('profiles')
                .select('id, email, created_at, updated_at') // IMPORTANT: Don't select credits
                .eq('id', user.id)
                .single();

            console.log("updateProfile: Fetched profile:", currentProfile);
            if (fetchError) throw fetchError;
            if (!currentProfile) {
                throw new Error("updateProfile: User profile not found.");
            }

            // Merge *only* the allowed updates (no credits).
            const mergedUpdates = {
                ...currentProfile,
                ...updates, // This will now *only* contain non-credit updates.
            };

            // Update *only* the non-credit fields in the database.
            console.log("updateProfile: Updating profile in Supabase...");
            const { error: updateError } = await supabase
                .from('profiles')
                .update(mergedUpdates) // Update with the merged object
                .eq('id', user.id)
                .select()
                .single();

            if (updateError) throw updateError;

            // Update the *local* profile state, but only the non-credit fields
            console.log("updateProfile: Calling setProfile with:", mergedUpdates);
            setProfile(currentProfile => {
                if (!currentProfile) {
                  console.error("updateProfile: currentProfile unexpectedly null!");
                  return null;
                }
                return {
                  ...currentProfile,
                  ...updates, // Apply only the allowed updates.
                };
            });

        } catch (error) {
            console.error('Error updating profile:', error);
            setIsLoading(false);
            throw error;
        } finally {
            setIsLoading(false);
            console.log("updateProfile: COMPLETED");
        }
    }, [user]); // Remove supabase from dependencies


    const updateCredits = useCallback(async (newCredits: number) => {
        if (!user) throw new Error('No user logged in');

        try {
            console.log("updateCredits: STARTING, newCredits:", newCredits);
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ credits: newCredits })
                .eq('id', user.id)
                .select()
                .single();

            if (updateError) throw updateError;

            // Only update the local credits state; do not toggle global isLoading.
            setCredits(newCredits);
            console.log("updateCredits: COMPLETED");
        } catch (error) {
            console.error('Error updating credits', error);
            throw error;
        }
    }, [user]); // Remove supabase from dependencies

    const recordUsage = useCallback(async (action: string, credits_consumed: number) => {
        if (!user || !profile) throw new Error('No user logged in');

        try {
            console.log(`recordUsage: STARTING - Action: ${action} - Credits: ${credits_consumed}`);
            
            if (!action) {
                console.error('recordUsage: action is required');
                return { success: false, error: 'Action description is required' };
            }

            if (credits_consumed < 0) {
                console.error('recordUsage: credits_consumed must be a non-negative number');
                return { success: false, error: 'Credits consumed must be a non-negative number' };
            }

            console.log(`Recording usage: ${profile.email} - ${action} - ${credits_consumed} credits`);

            const { error } = await supabase
                .from('usage_history')
                .insert({
                    user_email: profile.email,
                    action: action,
                    credits_consumed: credits_consumed
                });

            if (error) {
                console.error('Error recording usage:', error);
                return { success: false, error: error.message };
            }

            console.log("recordUsage: COMPLETED");
            return { success: true };
        } catch (error) {
            console.error('Exception in recordUsage:', error);
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Unknown error recording usage' 
            };
        }
    }, [user, profile]);

    const contextValue = useMemo(() => ({
        user,
        session,
        profile,
        credits, // Include credits in the context
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        signInWithGoogle: handleGoogleSignIn,
        resetPassword: handleResetPassword,
        updateProfile,
        updateCredits,
        recordUsage,
        isInitialized,
        recoverSession,
    }), [user, session, profile, credits, isLoading, isInitialized, signIn, signUp, signOut, handleGoogleSignIn, handleResetPassword, updateProfile, updateCredits, recordUsage, recoverSession]);


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