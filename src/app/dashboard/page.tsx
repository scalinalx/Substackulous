"use client";

import { useAuth } from '@/lib/contexts/AuthContext';
import { redirect } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
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
    title: "The Home Run",
    description: "Generate viral content for your Substack with AI-powered brainstorming, notes, and posts.",
    icon: "🚀",
    href: "/dashboard/home-run",
    color: "from-indigo-500 to-blue-500"
  },
  {
    title: "Idea Illustrator",
    description: "Transform your ideas into stunning visuals. No design skills needed.",
    icon: "✨",
    href: "/dashboard/illustrator",
    color: "from-purple-500 to-indigo-500"
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
  },
  {
    title: "AI Chat",
    description: "Chat with an AI assistant trained on Substack best practices.",
    icon: "💬",
    href: "/dashboard/chat",
    color: "from-red-500 to-pink-500"
  },
  {
    title: "Substack PRO",
    description: "Analyze and optimize your Substack newsletter for maximum growth and engagement.",
    icon: "📈",
    href: "/dashboard/substack-pro",
    color: "from-emerald-500 to-teal-500"
  },
  {
    title: "Notes with RAG",
    description: "Ask questions about your Substack notes using AI with RAG (Retrieval Augmented Generation).",
    icon: "🤖",
    href: "/dashboard/notes-rag",
    color: "from-cyan-500 to-blue-500"
  },
  {
    title: "Topic/Niche Research",
    description: "Coming Soon - Discover trending topics and untapped niches for your Substack.",
    icon: "🔍",
    href: "#",
    color: "from-teal-500 to-green-500",
    comingSoon: true
  },
  {
    title: "AI Coach",
    description: "Coming Soon - Get personalized guidance to grow your Substack audience.",
    icon: "🎯",
    href: "#",
    color: "from-violet-500 to-purple-500",
    comingSoon: true
  }
];

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated, isInitialized } = useAuth();

  if (!isInitialized || isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    redirect('/login');
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
              className={`group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden ${feature.comingSoon ? 'cursor-not-allowed opacity-75' : ''}`}
              onClick={feature.comingSoon ? (e) => e.preventDefault() : undefined}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
              <div className="p-6">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                  {feature.comingSoon && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Coming Soon
                    </span>
                  )}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
} 