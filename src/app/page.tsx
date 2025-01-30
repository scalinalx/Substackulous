"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import UseCases from './components/UseCases';
import PainPoints from './components/PainPoints';
import Testimonials from './components/Testimonials';
import Pricing from './components/Pricing';
import LoginForm from './components/LoginForm';

export default function HomePage() {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <main>
      <Navbar onSignIn={() => setShowLogin(true)} />
      {showLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
            <button 
              onClick={() => setShowLogin(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <LoginForm />
          </div>
        </div>
      )}
      <Hero onGetStarted={() => setShowLogin(true)} />
      <UseCases />
      <PainPoints />
      <Testimonials />
      <Pricing onGetStarted={() => setShowLogin(true)} />
    </main>
  );
}
