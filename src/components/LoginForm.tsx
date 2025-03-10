// src/components/LoginForm.tsx
'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTheme } from 'next-themes';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { signIn, signUp, resetPassword, isLoading } = useAuth();
  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark';

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message :
        typeof err === 'string' ? err :
        'An unknown error occurred'
      );
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const { error } = await signUp(email, password);
      if (error) throw error;
      setSuccess('Please check your email to verify your account.');
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message :
        typeof err === 'string' ? err :
        'Failed to sign up'
      );
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      const { error } = await resetPassword(email);
      if (error) throw error;
      setSuccess('Password reset instructions have been sent to your email.');
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message :
        typeof err === 'string' ? err :
        'Failed to reset password'
      );
    }
  };

  return (
    <div className={`max-w-md w-full space-y-6 p-8 ${isDarkTheme ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md`}>
      <div className="text-center">
        <h1 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Welcome Back</h1>
        <p className={`mt-2 ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>Sign in to your account or sign up to create an account</p>
      </div>

      <form onSubmit={handleEmailSignIn} className="space-y-4">
        <div>
          <label className={`block text-sm font-medium ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`mt-1 block w-full px-3 py-2 border ${isDarkTheme ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
              required
              disabled={isLoading}
              autoComplete="email"
            />
          </label>
        </div>
        
        <div>
          <label className={`block text-sm font-medium ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`mt-1 block w-full px-3 py-2 border ${isDarkTheme ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
              required
              disabled={isLoading}
              autoComplete="current-password"
            />
          </label>
        </div>

        {error && (
          <div className={`text-sm text-red-600 ${isDarkTheme ? 'bg-red-900/30 border-red-800' : 'bg-red-50 border-red-200'} border rounded-md p-3`}>
            {error}
          </div>
        )}

        {success && (
          <div className={`text-sm text-green-600 ${isDarkTheme ? 'bg-green-900/30 border-green-800' : 'bg-green-50 border-green-200'} border rounded-md p-3`}>
            {success}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
          
          <button
            type="button"
            onClick={handleSignUp}
            disabled={isLoading}
            className={`w-full flex justify-center py-2 px-4 border ${isDarkTheme ? 'border-gray-600 bg-green-700 text-gray-200 hover:bg-gray-600' : 'border-gray-300 bg-green-700 text-gray-700 hover:bg-gray-50'} rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Sign up
          </button>
          
          <button
            type="button"
            onClick={handleResetPassword}
            disabled={isLoading}
            className={`text-sm ${isDarkTheme ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-500'}`}
          >
            Forgot your password?
          </button>
        </div>
      </form>
    </div>
  );
}