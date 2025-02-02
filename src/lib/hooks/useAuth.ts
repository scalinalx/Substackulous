import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Create a custom event for credit updates
const CREDITS_UPDATED_EVENT = 'credits-updated';

export interface User {
  id: string;
  email?: string;
  displayName?: string;
  credits: number;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        updateUserState(session.user);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        updateUserState(session.user);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateUserState = async (supabaseUser: SupabaseUser) => {
    // Fetch user profile data including credits
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    const updatedUser = {
      id: supabaseUser.id,
      email: supabaseUser.email,
      displayName: profile?.full_name || supabaseUser.email,
      credits: profile?.credits || 0
    };

    setUser(updatedUser);
    // Dispatch event for credit updates
    window.dispatchEvent(new CustomEvent(CREDITS_UPDATED_EVENT, { 
      detail: { credits: profile?.credits || 0 }
    }));
  };

  const updateUserCredits = async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (profile && user) {
      const updatedUser = {
        ...user,
        credits: profile.credits
      };
      setUser(updatedUser);
      // Dispatch event for credit updates
      window.dispatchEvent(new CustomEvent(CREDITS_UPDATED_EVENT, { 
        detail: { credits: profile.credits }
      }));
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  return { user, signInWithGoogle, updateUserCredits };
}