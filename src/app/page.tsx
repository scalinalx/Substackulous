"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import UseCases from './components/UseCases';
// import PainPoints from '@/app/components/PainPoints';  // Commented out
import Testimonials from './components/Testimonials';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import LoginForm from './components/LoginForm';
import { CreativePricingDemo } from './components/CreativePricingDemo';

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
      {/* <PainPoints /> */}  {/* Commented out */}
      <Testimonials />
      <div id="pricing" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Choose Your Plan</h2>
          <CreativePricingDemo />
        </div>
      </div>
      {/* <Pricing onGetStarted={() => setShowLogin(true)} /> */}
      <FAQ />
    </main>
  );
}
