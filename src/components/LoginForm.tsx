// src/components/LoginForm.tsx
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { signIn, signInWithGoogle, isLoading, isInitialized } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log('LoginForm mounted');
  }, []);

  // Add direct click handler for the submit button
  const handleSubmitClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    console.log('Submit button clicked directly');
    handleEmailSignIn(e as any);
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    console.log('handleEmailSignIn called');
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Form submitted', { 
      email, 
      hasPassword: !!password,
      isLoading, 
      mounted, 
      isInitialized 
    });
    
    if (!mounted || !isInitialized) {
      console.log('Component not ready', { mounted, isInitialized });
      return;
    }

    if (isLoading) {
      console.log('Already loading, preventing duplicate submission');
      return;
    }

    setError(null);
    
    try {
      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }

      console.log('Attempting sign in...');
      const { error: signInError } = await signIn(email, password);
      console.log('Sign in response received', { hasError: !!signInError });
      
      if (signInError) throw signInError;
    } catch (err: unknown) {
      console.error('Login error:', err);
      setError(
        err instanceof Error ? err.message :
        typeof err === 'string' ? err :
        'An unknown error occurred'
      );
    }
  };

  const handleGoogleSignIn = async () => {
    console.log('Google sign in started');
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      console.error('Google sign in error:', err);
      setError(
        err instanceof Error ? err.message :
        typeof err === 'string' ? err :
        'Failed to sign in with Google'
      );
    }
  };

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return null;
  }

  return (
    <div className="max-w-md w-full space-y-6 p-8 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Welcome Back</h1>
        <p className="text-gray-600 mt-2">Sign in to your account</p>
      </div>

      <form onSubmit={handleEmailSignIn} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => {
                console.log('Email changed:', e.target.value);
                setEmail(e.target.value);
              }}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
              disabled={isLoading}
              autoComplete="email"
            />
          </label>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => {
                console.log('Password changed');
                setPassword(e.target.value);
              }}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
              disabled={isLoading}
              autoComplete="current-password"
            />
          </label>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          onClick={handleSubmitClick}
          disabled={isLoading || !mounted || !isInitialized}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>

        {isLoading && (
          <div className="text-sm text-gray-600 text-center">
            Processing your request...
          </div>
        )}

        <div className="text-sm text-gray-600 text-center">
          Status: {isLoading ? 'Loading' : 'Ready'} | 
          Mounted: {mounted ? 'Yes' : 'No'} | 
          Initialized: {isInitialized ? 'Yes' : 'No'}
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </button>
      </form>
    </div>
  );
}