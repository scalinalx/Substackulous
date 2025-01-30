"use client";

interface PricingProps {
  onGetStarted: () => void;
}

const Pricing = ({ onGetStarted }: PricingProps) => {
  const plans = [
    {
      name: "Starter",
      price: "$7",
      credits: "250",
      features: [
        "Perfect for hobby-ists",
        "Just Starting Out On Substack",
        "Boost your creativity and output",
        "AI Topic Generation",
        "Basic Analytics",
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Advanced",
      price: "$21",
      credits: "1,000",
      features: [
        "2x growth on your Substack journey",
        "Perfect if you post a couple of times a week",
        "Improve your conversion rate by 50% and save up to 30h/month",
        "Credits are 25% cheaper (compared to Starter)",
        "Priority Support",
      ],
      cta: "Get Started",
      popular: true,
    },
    {
      name: "Pro",
      price: "$47",
      credits: "3,300",
      features: [
        "5x growth on your Substack journey",
        <span key="serious">Perfect if you're <span className="font-bold italic">really serious</span> about Substack</span>,
        "Improve your conversion rate by 100% and save up to 90h/month",
        "Credits are 50% cheaper (compared to Starter)",
        "Dedicated Support & API Access",
      ],
      cta: "Get Started",
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
          Simple, Transparent Pricing
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative p-8 rounded-xl ${
                plan.popular
                  ? "bg-gray-100 text-gray-900 shadow-xl scale-105"
                  : "bg-white border border-gray-200"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-1 rounded-full text-sm">
                  Most Popular
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="flex items-baseline mb-2">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-sm opacity-80">/month</span>
              </div>
              <div className="text-lg font-semibold mb-6 text-gray-600">
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
              <button
                onClick={onGetStarted}
                className={`block w-full py-3 rounded-full font-medium text-center transition-colors ${
                  plan.popular
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing; 