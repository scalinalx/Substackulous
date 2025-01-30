"use client";

import Image from "next/image";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Tech Newsletter Creator",
      quote: "Doubled my subscriber base in just 3 months using Substackulous!",
      metric: "10,000+ new subscribers",
      image: "https://images.unsplash.com/photo-1500673922987-e212871fec22"
    },
    {
      name: "Michael Chen",
      role: "Finance Writer",
      quote: "The AI tools save me hours of research and writing time every week.",
      metric: "5x faster content creation",
      image: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7"
    },
    {
      name: "Emma Davis",
      role: "Lifestyle Blogger",
      quote: "Finally, a tool that actually understands what Substack creators need.",
      metric: "300% revenue increase",
      image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d"
    },
  ];

  return (
    <section id="testimonials" className="py-20 bg-gradient-to-b from-white to-amber-100/50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-amber-800 mb-12">
          Success Stories
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="group relative overflow-hidden p-6 rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute inset-0">
                <Image 
                  src={testimonial.image} 
                  alt={testimonial.name}
                  fill
                  className="object-cover opacity-5 group-hover:opacity-10 transition-opacity duration-300"
                />
              </div>
              <div className="relative">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-amber-100 overflow-hidden">
                    <div className="relative w-full h-full">
                      <Image 
                        src={testimonial.image} 
                        alt={testimonial.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-800">{testimonial.name}</h3>
                    <p className="text-sm text-amber-800/60">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-amber-800/80 mb-4">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="text-amber-500 font-semibold">{testimonial.metric}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials; 