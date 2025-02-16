// src/components/LoginForm.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { supabase } from '@/lib/supabase/clients';

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('LoginForm Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h2 className="text-red-700">Something went wrong.</h2>
          <pre className="mt-2 text-sm text-red-600">
            {this.state.error?.message}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

function LoginFormContent() {
  console.log('LoginFormContent rendering...');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { signIn, signInWithGoogle, isLoading, isInitialized } = useAuth();

  // Log initial auth state
  console.log('Initial auth state:', { signIn: !!signIn, isLoading, isInitialized });

  // Log state changes
  useEffect(() => {
    console.log('Form State Changed:', {
      mounted,
      isLoading,
      isInitialized,
      isSubmitting,
      hasEmail: !!email,
      hasPassword: !!password,
      hasError: !!error,
      hasSignIn: !!signIn
    });
  }, [mounted, isLoading, isInitialized, isSubmitting, email, password, error, signIn]);

  useEffect(() => {
    console.log('Component mounting...');
    setMounted(true);
    console.log('LoginForm mounted');
    
    // Log auth context on mount
    console.log('Auth context on mount:', {
      hasSignIn: !!signIn,
      isLoading,
      isInitialized
    });
  }, [signIn, isLoading, isInitialized]);

  const handleSubmit = useCallback(async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) {
      e.preventDefault();
    }
    console.log('🔵 Form submission started');
    
    // Log form state
    console.log('🔵 Form submission state:', {
      email: email ? 'provided' : 'missing',
      password: password ? 'provided' : 'missing',
      signInAvailable: !!signIn,
      mounted,
      isInitialized,
      isLoading,
      isSubmitting
    });

    if (isSubmitting) {
      console.log('🔴 Already submitting, preventing duplicate submission');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      console.log('🔵 Checking signIn availability...');
      if (!signIn) {
        console.log('🔴 signIn not available');
        throw new Error('Authentication not properly initialized');
      }

      console.log('🔵 Checking credentials...');
      if (!email || !password) {
        console.log('🔴 Missing credentials');
        throw new Error('Please enter both email and password');
      }

      console.log('🔵 Attempting sign in...');
      const result = await signIn(email, password);
      
      console.log('🔵 Sign in result:', { hasError: !!result.error });
      
      if (result.error) {
        console.log('🔴 Sign in error:', result.error);
        throw result.error;
      }

      console.log('🟢 Sign in successful');
    } catch (err) {
      console.error('🔴 Login error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      console.log('🔵 Resetting submit state');
      setIsSubmitting(false);
    }
  }, [email, password, signIn, mounted, isInitialized, isLoading, isSubmitting]);

  const handleGoogleSignIn = async () => {
    console.log('Google sign in clicked');
    if (!signInWithGoogle) {
      setError('Google sign in not available');
      return;
    }

    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Google sign in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
    }
  };

  // Always show debug panel now
  const debugPanel = (
    <div className="mb-4 p-4 bg-gray-100 rounded-md text-xs font-mono">
      <div>Mounted: {String(mounted)}</div>
      <div>Initialized: {String(isInitialized)}</div>
      <div>Loading: {String(isLoading)}</div>
      <div>Submitting: {String(isSubmitting)}</div>
      <div>Has Email: {String(!!email)}</div>
      <div>Has Password: {String(!!password)}</div>
      <div>Has Error: {String(!!error)}</div>
      <div>Has SignIn: {String(!!signIn)}</div>
    </div>
  );

  console.log('Rendering form with state:', {
    mounted,
    isLoading,
    isInitialized,
    isSubmitting,
    hasEmail: !!email,
    hasPassword: !!password
  });

  return (
    <div className="space-y-6 bg-white p-8 rounded-lg shadow-md">
      {debugPanel}

      <div className="text-center">
        <h1 className="text-2xl font-bold">Welcome Back</h1>
        <p className="text-gray-600 mt-2">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => {
                console.log('Email changed:', e.target.value ? 'provided' : 'empty');
                setEmail(e.target.value);
              }}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
              disabled={isLoading || isSubmitting}
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
                console.log('Password changed:', e.target.value ? 'provided' : 'empty');
                setPassword(e.target.value);
              }}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
              disabled={isLoading || isSubmitting}
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
          onClick={() => {
            console.log('🔵 Submit button clicked');
            handleSubmit();
          }}
          disabled={isLoading || isSubmitting || !mounted || !isInitialized}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>

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
          disabled={isLoading || isSubmitting}
          className="w-full flex items-center justify-center gap-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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

export default function LoginForm() {
  console.log('LoginForm wrapper rendering');
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md">
        <ErrorBoundary>
          <LoginFormContent />
        </ErrorBoundary>
      </div>
    </div>
  );
}