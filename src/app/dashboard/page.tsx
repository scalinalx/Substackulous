"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';

const features = [
  {
    title: "Advanced Post Thumbnail Generator",
    description: "Create eye-catching thumbnails with AI-powered text overlay. Perfect for viral posts.",
    icon: "🎨",
    href: "/dashboard/thumbnails",
    color: "from-pink-500 to-rose-500"
  },
  {
    title: "Idea Illustrator",
    description: "Transform your ideas into stunning visuals. No design skills needed.",
    icon: "✨",
    href: "/dashboard/illustrator",
    color: "from-purple-500 to-indigo-500"
  },
  {
    title: "Viral Note Generator",
    description: "Generate viral-worthy notes that captivate your audience.",
    icon: "🚀",
    href: "/dashboard/viral",
    color: "from-blue-500 to-cyan-500"
  },
  {
    title: "Clickworthy Title Generator",
    description: "Craft irresistible titles that drive clicks and engagement.",
    icon: "✍️",
    href: "/dashboard/titles",
    color: "from-green-500 to-emerald-500"
  },
  {
    title: "Post Outline Generator",
    description: "Create structured outlines for high-performing posts.",
    icon: "📝",
    href: "/dashboard/outline",
    color: "from-amber-500 to-orange-500"
  }
];

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Welcome to Your Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Link 
              key={feature.title} 
              href={feature.href}
              className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
              <div className="p-6">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
} 