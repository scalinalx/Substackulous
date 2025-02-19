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
import { supabase, withRetry } from "@/lib/supabase/clients";
import {
  logoutUser,
  signInWithGoogle,
  resetPassword as resetPasswordUtil,
} from "../supabase/authUtils";

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

  const RETRY_DELAY = 1000; // 1 second
  const MAX_RETRIES = 3;

    const fetchProfile = useCallback(async (userId: string) => {
        try {
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
    }, [profile, credits, supabase]); // Add credits to dependencies


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
                const { data: { session: currentSession } } = await supabase.auth.getSession();

                if (currentSession) {
                    setSession(currentSession);
                    setUser(currentSession.user);
                    await fetchProfile(currentSession.user.id);
                } else if (session) {
                    setSession(null);
                    setUser(null);
                    setProfile(null);
                    setCredits(null);
                    router.replace('/login');
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [fetchProfile, router, session]);

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
                cleanup = startSessionCheck();
            } catch (error) {
                console.error('Auth initialization error:', error);
                setUser(null);
                setSession(null);
                setProfile(null);
                setCredits(null);
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
      setCredits(null);
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
    }, [user, supabase]);


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
    }, [user, supabase]);


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
        isInitialized
    // Make sure to add credits to the dependencies array here
    }), [user, session, profile, credits, isLoading, isInitialized, signIn, signUp, signOut, handleGoogleSignIn, handleResetPassword, updateProfile, updateCredits]);


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