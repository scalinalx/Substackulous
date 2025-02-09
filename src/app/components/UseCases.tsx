"use client";

import { Check } from "lucide-react";
import Image from "next/image";

export default function UseCases() {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Tech Newsletter Writer",
      avatar: "👩‍💻",
      text: "Substackulous helped me grow my newsletter from 500 to 5,000 subscribers in just 3 months. The AI tools are incredible!"
    },
    {
      name: "Michael Rodriguez",
      role: "Finance Writer",
      avatar: "👨‍💼",
      text: "The viral note generator is pure gold. My engagement rates have tripled since I started using it."
    },
    {
      name: "Emma Thompson",
      role: "Culture Writer",
      avatar: "👩‍🎨",
      text: "This tool has completely transformed how I create content. It's like having a professional editor by my side."
    },
    {
      name: "David Kim",
      role: "Tech Analyst",
      avatar: "🧑‍💻",
      text: "The AI suggestions are spot-on. It's helped me maintain consistency while growing my audience."
    },
    {
      name: "Lisa Wang",
      role: "Health & Wellness Writer",
      avatar: "👩‍⚕️",
      text: "From ideation to publication, Substackulous has streamlined my entire writing process."
    },
    {
      name: "James Foster",
      role: "Sports Analyst",
      avatar: "🏃‍♂️",
      text: "The engagement on my posts has skyrocketed. Best investment for my newsletter growth."
    }
  ];

  return (
    <section>
      {/* Transform Your Substack Journey Section */}
      <div className="bg-[#2a2632] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Transform Your Substack Journey
          </h2>
          <div className="relative max-w-3xl mx-auto">
            <div className="grid grid-cols-2 gap-16">
              {/* First Row */}
              <div className="relative">
                <div className="bg-gray-100 rounded-lg p-6 flex flex-col items-center justify-center space-y-4 transform hover:scale-105 transition-transform">
                  <div className="text-4xl mb-2">⚡️</div>
                  <h3 className="text-lg font-semibold text-gray-900 text-center">
                    500% Faster Content Creation
                  </h3>
                </div>
                {/* Arrow 1 */}
                <div className="absolute -right-12 top-1/2 transform -translate-y-1/2 text-yellow-400 text-4xl rotate-0">
                  ➜
                </div>
              </div>
              
              <div className="relative">
                <div className="bg-gray-100 rounded-lg p-6 flex flex-col items-center justify-center space-y-4 transform hover:scale-105 transition-transform">
                  <div className="text-4xl mb-2">📈</div>
                  <h3 className="text-lg font-semibold text-gray-900 text-center">
                    3x Subscriber Growth
                  </h3>
                </div>
                {/* Arrow 2 */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-yellow-400 text-4xl rotate-90">
                  ➜
                </div>
              </div>

              {/* Second Row */}
              <div className="relative">
                <div className="bg-gray-100 rounded-lg p-6 flex flex-col items-center justify-center space-y-4 transform hover:scale-105 transition-transform">
                  <div className="text-4xl mb-2">💰</div>
                  <h3 className="text-lg font-semibold text-gray-900 text-center">
                    Double Your Conversion Rate
                  </h3>
                </div>
                {/* Arrow 3 */}
                <div className="absolute -right-12 top-1/2 transform -translate-y-1/2 text-yellow-400 text-4xl rotate-0">
                  ➜
                </div>
              </div>

              <div className="bg-gray-100 rounded-lg p-6 flex flex-col items-center justify-center space-y-4 transform hover:scale-105 transition-transform">
                <div className="text-4xl mb-2">⏰</div>
                <h3 className="text-lg font-semibold text-gray-900 text-center">
                  90% Time Saved
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Marquee */}
      <div className="bg-gray-50 py-16 overflow-hidden">
        <div className="relative">
          <div className="flex animate-marquee space-x-8 whitespace-nowrap">
            {testimonials.concat(testimonials).map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-6 shadow-sm flex items-start space-x-4 min-w-[400px]"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                  {testimonial.avatar}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-gray-500 mb-2">{testimonial.role}</p>
                  <p className="text-sm text-gray-600">{testimonial.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Common Challenges Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
          Common Challenges, Solved
        </h2>
        <h3 className="text-xl text-gray-600 text-center mb-12">
          Substackulous Is For You If...
        </h3>

        {/* Row 1: 2/3 text, 1/3 illustration */}
        <div className="flex items-center mb-16">
          <div className="w-2/3 pr-8">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h3 className="text-xl font-semibold mb-4">You&apos;re Struggling with Consistency</h3>
              <p className="text-gray-600">
                Finding it hard to maintain a regular publishing schedule? Our AI-powered tools help you create quality content in a fraction of the time, making it easier to stay consistent.
              </p>
            </div>
          </div>
          <div className="w-1/3">
            <div className="bg-gray-100 rounded-lg aspect-square flex items-center justify-center">
              <span className="text-4xl">🎯</span>
            </div>
          </div>
        </div>

        {/* Row 2: 1/3 illustration, 2/3 text */}
        <div className="flex items-center mb-16">
          <div className="w-1/3">
            <div className="bg-gray-100 rounded-lg aspect-square flex items-center justify-center">
              <span className="text-4xl">💡</span>
            </div>
          </div>
          <div className="w-2/3 pl-8">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h3 className="text-xl font-semibold mb-4">You&apos;re Running Out of Ideas</h3>
              <p className="text-gray-600">
                Writer&apos;s block hitting hard? Our AI assistant helps generate fresh content ideas and outlines tailored to your niche and audience preferences.
              </p>
            </div>
          </div>
        </div>

        {/* Row 3: 2/3 text, 1/3 illustration */}
        <div className="flex items-center mb-16">
          <div className="w-2/3 pr-8">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h3 className="text-xl font-semibold mb-4">Your Growth Has Plateaued</h3>
              <p className="text-gray-600">
                Stuck at the same subscriber count? Our tools help optimize your content for maximum engagement and growth, using proven strategies from successful Substack writers.
              </p>
            </div>
          </div>
          <div className="w-1/3">
            <div className="bg-gray-100 rounded-lg aspect-square flex items-center justify-center">
              <span className="text-4xl">📈</span>
            </div>
          </div>
        </div>

        {/* Row 4: 1/3 illustration, 2/3 text */}
        <div className="flex items-center mb-16">
          <div className="w-1/3">
            <div className="bg-gray-100 rounded-lg aspect-square flex items-center justify-center">
              <span className="text-4xl">⚡</span>
            </div>
          </div>
          <div className="w-2/3 pl-8">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h3 className="text-xl font-semibold mb-4">You Need to Scale Your Process</h3>
              <p className="text-gray-600">
                Want to produce more content without sacrificing quality? Our automation tools streamline your workflow while maintaining your unique voice and style.
              </p>
            </div>
          </div>
        </div>

        {/* Row 5: 2/3 text, 1/3 illustration */}
        <div className="flex items-center">
          <div className="w-2/3 pr-8">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h3 className="text-xl font-semibold mb-4">You Want to Stand Out</h3>
              <p className="text-gray-600">
                Looking to differentiate your newsletter? Our AI helps you develop unique angles and perspectives that set your content apart from the competition.
              </p>
            </div>
          </div>
          <div className="w-1/3">
            <div className="bg-gray-100 rounded-lg aspect-square flex items-center justify-center">
              <span className="text-4xl">✨</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 