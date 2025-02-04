import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { User } from '@supabase/supabase-js';

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
        const userDoc = await getDoc(doc(db, 'users', user.id));
        if (userDoc.exists()) {
          setCredits(userDoc.data().credits || 0);
        }
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
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        credits: increment(-amount)
      });
      setCredits(prev => prev - amount);
    } catch (error) {
      console.error('Error subtracting credits:', error);
      throw error;
    }
  };

  const addCredits = async (amount: number) => {
    if (!user) return;
    
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        credits: increment(amount)
      });
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