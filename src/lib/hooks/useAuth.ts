import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User as SupabaseUser } from '@supabase/supabase-js';

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

    setUser({
      id: supabaseUser.id,
      email: supabaseUser.email,
      displayName: profile?.full_name || supabaseUser.email,
      credits: profile?.credits || 0
    });
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

  return { user, signInWithGoogle };
}