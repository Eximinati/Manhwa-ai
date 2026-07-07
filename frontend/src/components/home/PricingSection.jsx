import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["3 videos / month", "720p export", "Hinglish narration"],
    accent: "#00F5D4",
  },
  {
    name: "Pro",
    price: "$9",
    period: "/ month",
    features: ["Unlimited videos", "1080p export", "All languages", "Priority support"],
    accent: "#FF006E",
    popular: true,
  },
  {
    name: "Studio",
    price: "$29",
    period: "/ month",
    features: ["Everything in Pro", "4K export", "API access", "Custom branding"],
    accent: "#FFD60A",
  },
];

const PricingSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative z-10 py-28 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="magazine-kicker">Pricing</span>
          <h2 className="display text-4xl sm:text-5xl text-white mt-2">
            Choose your <span className="text-[#FF006E]">plan</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-white/10 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-[#0A0A1A] p-10 flex flex-col ${
                plan.popular ? "md:-mt-4 md:mb-4 bg-[#1A1A2E] border-2 border-[#FF006E]" : ""
              }`}
            >
              <div className="mb-2 display text-2xl tracking-wider text-white">{plan.name}</div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="display text-5xl text-white">{plan.price}</span>
                <span className="font-body text-sm text-gray-500">{plan.period}</span>
              </div>
              <div className="flex-1 space-y-3 mb-8">
                {plan.features.map((f) => (
                  <div key={f} className="font-body text-sm text-gray-300 flex items-center gap-2">
                    <span style={{ color: plan.accent }}>—</span> {f}
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate("/upload")}
                className="w-full py-3 font-body text-sm font-semibold tracking-wider transition-all active:scale-[0.98]"
                style={{
                  background: plan.popular ? plan.accent : "transparent",
                  color: plan.popular ? "#fff" : "#fff",
                  border: plan.popular ? "none" : "1px solid rgba(255,255,255,0.2)",
                }}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
