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

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <UseCases />
      <PainPoints />
      <Testimonials />
      <Pricing />
    </main>
  );
}
