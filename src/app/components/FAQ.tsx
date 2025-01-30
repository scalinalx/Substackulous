"use client";

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "How does Substackulous help me grow my newsletter?",
      answer: "Substackulous uses advanced AI to help you create more engaging content, optimize your headlines, and generate viral-worthy notes that resonate with your audience. Our tools are specifically designed to boost subscriber growth and engagement rates."
    },
    {
      question: "What can I do with my credits?",
      answer: "Credits can be used for all our AI-powered features including generating viral notes, creating engaging titles, optimizing your content, and getting personalized growth recommendations. Each feature uses a different amount of credits based on its complexity."
    },
    {
      question: "Do unused credits roll over to the next month?",
      answer: "Yes! Your unused credits will roll over for up to 3 months, giving you flexibility in how and when you use them. This is especially helpful during busy publishing periods or when planning larger content initiatives."
    },
    {
      question: "Can I cancel or change my plan anytime?",
      answer: "Absolutely! You can upgrade, downgrade, or cancel your plan at any time. If you cancel, you'll still have access to your remaining credits until the end of your billing period."
    },
    {
      question: "How do I know if Substackulous is right for me?",
      answer: "If you're looking to grow your Substack newsletter, save time on content creation, and increase your conversion rates, Substackulous is perfect for you. We offer a free trial so you can test our tools and see the impact firsthand."
    }
  ];

  return (
    <section id="faq" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
          Frequently Asked Questions
        </h2>
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="text-lg font-medium text-gray-900">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ; 