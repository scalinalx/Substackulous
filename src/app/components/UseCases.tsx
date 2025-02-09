"use client";

import { Check } from "lucide-react";
import Image from "next/image";

export default function UseCases() {
  return (
    <section>
      {/* Transform Your Substack Journey Section */}
      <div className="bg-[#2a2632] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Transform Your Substack Journey
          </h2>
          <div className="grid grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* First Row */}
            <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center">
              <h3 className="text-xl font-semibold text-gray-900 text-center">
                500% Faster Content Creation
              </h3>
            </div>
            <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center">
              <h3 className="text-xl font-semibold text-gray-900 text-center">
                3x Subscriber Growth
              </h3>
            </div>
            {/* Second Row */}
            <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center">
              <h3 className="text-xl font-semibold text-gray-900 text-center">
                Double Your Conversion Rate
              </h3>
            </div>
            <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center">
              <h3 className="text-xl font-semibold text-gray-900 text-center">
                90% Time Saved
              </h3>
            </div>
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