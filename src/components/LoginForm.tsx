// src/components/LoginForm.tsx
'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTheme } from 'next-themes';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { signIn, isLoading } = useAuth();
  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark';

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
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

  return (
    <div className={`max-w-md w-full space-y-6 p-8 ${isDarkTheme ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md`}>
      <div className="text-center">
        <h1 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Welcome Back</h1>
        <p className={`mt-2 ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>Sign in to your account</p>
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
            />
          </label>
        </div>

        {error && (
          <div className={`text-sm text-red-600 ${isDarkTheme ? 'bg-red-900/30 border-red-800' : 'bg-red-50 border-red-200'} border rounded-md p-3`}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}