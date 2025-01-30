"use client";

import { Check } from "lucide-react";
import Image from "next/image";

const UseCases = () => {
  const cases = [
    {
      title: "500% Faster Content Creation",
      description: "AI-powered writing assistance and topic generation",
      image: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7"
    },
    {
      title: "2x Subscriber Growth",
      description: "Smart audience targeting and engagement tools",
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158"
    },
    {
      title: "90% Time Saved",
      description: "Automated workflows and content optimization",
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085"
    },
  ];

  return (
    <section id="use-cases" className="py-20 bg-gradient-to-b from-white to-amber-100/50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-amber-800 mb-12">
          Transform Your Substack Journey
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cases.map((item, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-xl bg-white hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute inset-0">
                <Image 
                  src={item.image} 
                  alt={item.title}
                  fill
                  className="object-cover opacity-10 group-hover:opacity-15 transition-opacity duration-300"
                />
              </div>
              <div className="relative p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <Check className="w-5 h-5 text-amber-800" />
                  </div>
                  <h3 className="font-semibold text-xl text-amber-800">{item.title}</h3>
                </div>
                <p className="text-amber-800/80">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases; 