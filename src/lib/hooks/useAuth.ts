import { useState, useEffect } from 'react';

export interface User {
  uid: string;
  email?: string;
  displayName?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  // Mock authentication for now
  useEffect(() => {
    // In a real app, this would be replaced with actual auth logic
    setUser({
      uid: 'mock-user-id',
      email: 'user@example.com',
      displayName: 'Test User'
    });
  }, []);

  return { user };
}