"use client"

import { Layers, DollarSign, Clock, CheckCircle, Star } from "lucide-react";
import Image from "next/image";

export function AllInOneAdvantage() {
  return (
    <div className="rounded-2xl p-8 lg:p-12 mb-16">
      <h2 className="text-5xl font-bold text-white mb-8 text-center tracking-tighter">One Tool. Endless Value.</h2>
      <h3 className="text-3xl font-bold text-white mb-8 text-center tracking-tighter">Save up to $250/month when you switch to Substackulous.</h3>

      
      <div className="flex flex-col items-center gap-12 mb-10">
        <div className="w-full">
          <div className="bg-indigo-600 text-white p-6 rounded-xl mb-6 w-full">
            <Layers className="h-10 w-10 mb-4" />
            <h3 className="text-xl font-bold mb-3">Multi-Purpose Suite Powered by CUSTOM-BUILT AI</h3>
            <p>Substackulous combines every tool you need into one powerful platform, driven by our proprietary AI engine specifically designed for Substack creators.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-4/5 mx-auto">
            {[
              { icon: <DollarSign className="h-5 w-5" />, text: "Save up to $300/month on tool subscriptions" },
              { icon: <Clock className="h-5 w-5" />, text: "Cut your workflow time by 75%" },
              { icon: <CheckCircle className="h-5 w-5" />, text: "New features added monthly" },
              { icon: <Star className="h-5 w-5" />, text: "Future-proof your content strategy" }
            ].map((item, index) => (
              <div key={index} className="bg-indigo-50 p-4 rounded-lg flex items-center">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3 text-indigo-600">
                  {item.icon}
                </div>
                <p className="text-gray-700 text-sm font-medium">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="w-full flex justify-center">
          <div className="max-w-md">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Replace All These Tools With Just One:</h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                "Content brainstorming tools",
                "Thumbnail generators",
                "Writing assistants",
                "SEO research tools",
                "Analytics platforms",
                "Outline generators",
                "Image creation tools",
                "Competitor research",
                "Newsletter templates",
                "Offer builders",
                "Topic research tools",
                "Viral content analyzers"
              ].map((item, index) => (
                <div key={index} className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-600">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Image 
        src="/tag1.png" 
        alt="All-in-One Advantage" 
        className="w-full rounded-xl"
        width={1200}
        height={600} 
      />
      <div className="text-center p-6 bg-black-50 rounded-xl">
        <h3 className="text-2xl font-bold text-gray-300 mb-3">Simplified Workflow. Reduced Costs. Better Results.</h3>
        <p className="text-lg text-gray-300 max-w-3xl mx-auto">
          We&apos;re constantly adding new features and functionality to make Substackulous so good you don&apos;t need anything else. One subscription. Unlimited value.
        </p>
      </div>
    </div>
  );
} 