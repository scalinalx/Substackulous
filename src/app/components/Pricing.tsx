"use client";

import Link from "next/link";

const Pricing = () => {
  const plans = [
    {
      name: "Starter",
      price: "$7",
      credits: "250",
      features: [
        "AI Topic Generation",
        "Viral Note Generation",
        "Title Generation",
        "Basic Analytics",
        "Email Support",
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Pro",
      price: "$21",
      credits: "1,000",
      features: [
        "Everything in Starter",
        "Advanced Analytics",
        "Priority Support",
        "Bulk Generation",
        "Custom Branding",
      ],
      cta: "Get Started",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "$47",
      credits: "3,300",
      features: [
        "Everything in Pro",
        "Dedicated Support",
        "Custom Integration",
        "API Access",
        "Team Collaboration",
      ],
      cta: "Get Started",
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-amber-800 mb-12">
          Simple, Transparent Pricing
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative p-8 rounded-xl ${
                plan.popular
                  ? "bg-amber-100 text-amber-800 shadow-xl scale-105"
                  : "bg-white border border-gray-200"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-800 text-white px-4 py-1 rounded-full text-sm">
                  Most Popular
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="flex items-baseline mb-2">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-sm opacity-80">/month</span>
              </div>
              <div className="text-lg font-semibold mb-6 text-amber-500">
                {plan.credits} credits
              </div>
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/dashboard"
                className={`block w-full py-3 rounded-full font-medium text-center transition-colors ${
                  plan.popular
                    ? "bg-amber-800 text-white hover:bg-amber-700"
                    : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing; 