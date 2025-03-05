"use client"

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What makes Substackulous different from other newsletter platforms?",
    answer: "Substackulous combines AI-powered content suggestions, advanced analytics, and seamless monetization tools in one platform. Our unique approach helps writers create more engaging content, understand their audience better, and maximize their revenue potential."
  },
  {
    question: "How does the AI content assistance work?",
    answer: "Our AI analyzes your writing style, audience engagement patterns, and trending topics to suggest content ideas, optimal posting times, and even headline improvements. It's like having a personal writing assistant that helps you create content your audience will love."
  },
  {
    question: "What analytics features are included?",
    answer: "Substackulous provides comprehensive analytics including subscriber growth trends, engagement metrics, revenue analytics, and audience segmentation. You'll get actionable insights to help grow your newsletter and increase engagement."
  },
  {
    question: "Can I migrate my existing newsletter to Substackulous?",
    answer: "Absolutely! We offer seamless migration tools and dedicated support to help you transfer your existing subscribers, content, and payment systems to Substackulous without any disruption to your newsletter."
  },
  {
    question: "What are the pricing options?",
    answer: "We offer flexible pricing tiers starting with a free plan for new writers. Premium features are available in our Pro and Enterprise plans, with pricing based on subscriber count and feature requirements. Contact our sales team for detailed pricing information."
  }
];

export function FAQ() {
  return (
    <section className="container py-24 sm:py-32">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
        className="text-center max-w-3xl mx-auto mb-16"
      >
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
          Frequently Asked <span className="text-primary">Questions</span>
        </h2>
        <p className="text-muted-foreground text-lg">
          Everything you need to know about Substackulous
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto"
      >
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-center">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-center">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </section>
  );
} 