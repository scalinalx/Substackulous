'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClientComponentClient, User as SupabaseUser } from '@supabase/auth-helpers-nextjs';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

// Create a custom event for credit updates
const CREDITS_UPDATED_EVENT = 'credits-updated';

export interface Profile {
  id: string;
  email: string;
  credits: number;
  created_at: string;
}

export function useAuth() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  const updateUserState = useCallback(async (_event: AuthChangeEvent, session: Session | null) => {
    if (session?.user) {
      setUser(session.user);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setProfile(null);
      } else {
        setProfile(profileData);
      }
    } else {
      setUser(null);
      setProfile(null);
    }
  }, [supabase]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(updateUserState);

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth, updateUserState]);

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