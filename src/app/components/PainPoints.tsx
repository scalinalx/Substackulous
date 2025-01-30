"use client";

const PainPoints = () => {
  const points = [
    {
      title: "Tired of Stagnant Growth?",
      solution: "Our AI tools help you reach 10x more readers",
    },
    {
      title: "Struggling with Content Ideas?",
      solution: "Get unlimited AI-powered topic suggestions",
    },
    {
      title: "Low Conversion Rates?",
      solution: "Optimize every aspect of your newsletter",
    },
  ];

  return (
    <section id="pain-points" className="py-20 bg-gradient-to-b from-white to-amber-100/50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-amber-800 mb-12">
          Common Challenges, Solved
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {points.map((point, index) => (
            <div
              key={index}
              className="group p-6 rounded-xl bg-white hover:shadow-xl transition-all duration-300"
            >
              <h3 className="text-xl font-semibold text-amber-800 mb-3">{point.title}</h3>
              <p className="text-amber-500 font-medium group-hover:translate-x-1 transition-transform">
                {point.solution} →
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PainPoints; 