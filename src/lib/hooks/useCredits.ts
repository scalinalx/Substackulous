import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useCredits() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCredits(0);
      setLoading(false);
      return;
    }

    const fetchCredits = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setCredits(data?.credits || 0);
      } catch (error) {
        console.error('Error fetching credits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, [user]);

  const subtractCredits = async (amount: number) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ credits: credits - amount })
        .eq('id', user.id);

      if (error) throw error;
      setCredits(prev => prev - amount);
    } catch (error) {
      console.error('Error subtracting credits:', error);
      throw error;
    }
  };

  const addCredits = async (amount: number) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ credits: credits + amount })
        .eq('id', user.id);

      if (error) throw error;
      setCredits(prev => prev + amount);
    } catch (error) {
      console.error('Error adding credits:', error);
      throw error;
    }
  };

  return {
    credits,
    loading,
    subtractCredits,
    addCredits
  };
} 