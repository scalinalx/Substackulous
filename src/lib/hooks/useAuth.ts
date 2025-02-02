import { useState, useEffect } from 'react';

export interface User {
  id: string;
  email?: string;
  displayName?: string;
  credits: number;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  // Mock authentication for now
  useEffect(() => {
    // In a real app, this would be replaced with actual auth logic
    setUser({
      id: 'mock-user-id',
      email: 'user@example.com',
      displayName: 'Test User',
      credits: 10
    });
  }, []);

  const signInWithGoogle = async () => {
    // Mock sign in for now
    setUser({
      id: 'mock-user-id',
      email: 'user@example.com',
      displayName: 'Test User',
      credits: 10
    });
  };

  return { user, signInWithGoogle };
}