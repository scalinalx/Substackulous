"use client"

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    name: "Thomas Wright",
    role: "Finance Newsletter Creator",
    image: "https://i.pravatar.cc/150?img=11",
    content: "Substackulous transformed my newsletter game. The AI-powered suggestions have doubled my subscriber engagement!",
    initials: "TW"
  },
  {
    name: "Olivia Parker",
    role: "Science Journalist",
    image: "https://i.pravatar.cc/150?img=12",
    content: "The analytics insights are incredible. I've grown my subscriber base by 300% in just three months.",
    initials: "OP"
  },
  {
    name: "Daniel Kim",
    role: "Political Analyst",
    image: "https://i.pravatar.cc/150?img=13",
    content: "Finally, a platform that makes monetization easy! My premium subscription revenue has skyrocketed.",
    initials: "DK"
  },
  {
    name: "Sophia Martinez",
    role: "Health & Wellness Writer",
    image: "https://i.pravatar.cc/150?img=14",
    content: "The automated email sequences and smart segmentation have revolutionized how I engage with my audience.",
    initials: "SM"
  },
  {
    name: "Noah Williams",
    role: "Crypto Newsletter Publisher",
    image: "https://i.pravatar.cc/150?img=15",
    content: "The A/B testing features are a game-changer. My conversion rates have improved by 75% since switching.",
    initials: "NW"
  },
  {
    name: "Ava Johnson",
    role: "Culture Critic",
    image: "https://i.pravatar.cc/150?img=16",
    content: "The personalization tools help me deliver exactly what my readers want. My engagement rates are through the roof!",
    initials: "AJ"
  },
  {
    name: "Ethan Brown",
    role: "Business Strategy Writer",
    image: "https://i.pravatar.cc/150?img=17",
    content: "The SEO optimization tools have dramatically increased my organic traffic. Best investment for my newsletter!",
    initials: "EB"
  },
  {
    name: "Isabella Lee",
    role: "Art & Design Publisher",
    image: "https://i.pravatar.cc/150?img=18",
    content: "The integration capabilities are fantastic. Everything works seamlessly with my existing tech stack.",
    initials: "IL"
  },
  {
    name: "Lucas Taylor",
    role: "Environmental Journalist",
    image: "https://i.pravatar.cc/150?img=19",
    content: "The community features have helped me build a loyal following. My readers are more engaged than ever!",
    initials: "LT"
  }
];

export function Testimonials1() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 sm:pb-32 pt-0 mt-0">
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
          Join thousands of successful writers who've transformed their newsletters with Substackulous
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
    </section>
  );
} 