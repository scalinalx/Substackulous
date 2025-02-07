'use client';
import { useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import LoginForm from '@/components/LoginForm';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function LoginPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return <LoginForm />;
}
