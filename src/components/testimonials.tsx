"use client"

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Content Creator",
    image: "https://i.pravatar.cc/150?img=1",
    content: "Substackulous transformed my newsletter game. The AI-powered suggestions have doubled my subscriber engagement!",
    initials: "SJ"
  },
  {
    name: "Michael Chen",
    role: "Tech Journalist",
    image: "https://i.pravatar.cc/150?img=2",
    content: "The analytics insights are incredible. I've grown my subscriber base by 300% in just three months.",
    initials: "MC"
  },
  {
    name: "Emma Davis",
    role: "Independent Writer",
    image: "https://i.pravatar.cc/150?img=3",
    content: "Finally, a platform that makes monetization easy! My premium subscription revenue has skyrocketed.",
    initials: "ED"
  },
  {
    name: "David Wilson",
    role: "Finance Newsletter Editor",
    image: "https://i.pravatar.cc/150?img=4",
    content: "The automated email sequences and smart segmentation have revolutionized how I engage with my audience.",
    initials: "DW"
  },
  {
    name: "Lisa Zhang",
    role: "Digital Marketing Expert",
    image: "https://i.pravatar.cc/150?img=5",
    content: "The A/B testing features are a game-changer. My conversion rates have improved by 75% since switching.",
    initials: "LZ"
  },
  {
    name: "James Rodriguez",
    role: "Sports Analyst",
    image: "https://i.pravatar.cc/150?img=6",
    content: "The personalization tools help me deliver exactly what my readers want. My engagement rates are through the roof!",
    initials: "JR"
  },
  {
    name: "Rachel Thompson",
    role: "Lifestyle Blogger",
    image: "https://i.pravatar.cc/150?img=7",
    content: "The SEO optimization tools have dramatically increased my organic traffic. Best investment for my newsletter!",
    initials: "RT"
  },
  {
    name: "Alex Foster",
    role: "Tech Newsletter Owner",
    image: "https://i.pravatar.cc/150?img=8",
    content: "The integration capabilities are fantastic. Everything works seamlessly with my existing tech stack.",
    initials: "AF"
  },
  {
    name: "Maria Garcia",
    role: "Food & Culture Writer",
    image: "https://i.pravatar.cc/150?img=9",
    content: "The community features have helped me build a loyal following. My readers are more engaged than ever!",
    initials: "MG"
  }
];

export function Testimonials() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
        className="text-center max-w-3xl mx-auto mb-16"
      >
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
          Loved by <span className="text-primary">creators</span> worldwide
        </h2>
        <p className="text-muted-foreground text-lg">
          Join thousands of successful writers who&apos;ve transformed their newsletters with Substackulous
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={testimonial.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            <Card className="h-full relative overflow-hidden bg-gradient-to-b from-background to-background/80 border-primary/10 hover:border-primary/30 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={testimonial.image} />
                    <AvatarFallback>{testimonial.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{testimonial.name}</h3>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-muted-foreground italic">&quot;{testimonial.content}&quot;</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        viewport={{ once: true }}
        className="mt-16 text-center"
      >
        <Button 
          size="lg" 
          className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-6 rounded-lg text-xl shadow-lg"
          onClick={() => {
            document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          JOIN THESE SUCCESS STORIES
        </Button>
      </motion.div>
    </section>
  );
} 