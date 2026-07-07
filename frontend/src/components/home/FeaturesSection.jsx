const features = [
  { emoji: "⚡", title: "Fast", desc: "From PDF to video in minutes", accent: "text-[#FF006E]" },
  { emoji: "🎬", title: "Automated", desc: "Panels, script, audio — all AI-powered", accent: "text-[#00F5D4]" },
  { emoji: "🌐", title: "Multi-language", desc: "Hinglish, Hindi, English & more", accent: "text-[#FFD60A]" },
  { emoji: "🎨", title: "Browser-based", desc: "No install. No upload to a server.", accent: "text-[#FF6B35]" },
  { emoji: "✏️", title: "Editable", desc: "Remove panels, tweak script before render", accent: "text-[#9B5DE5]" },
  { emoji: "📱", title: "Any device", desc: "Works on desktop, tablet, mobile", accent: "text-[#00F5D4]" },
];

const FeaturesSection = () => {
  return (
    <section className="relative z-10 py-24 px-6">
      <div className="max-w-7xl mx-auto mb-10">
        <span className="magazine-kicker">Features</span>
        <h2 className="display text-4xl sm:text-5xl text-white mt-2">
          What you <span className="text-[#FF006E]">get</span>
        </h2>
      </div>

      <div className="horiz-scroll flex gap-3 pb-4 -mx-6 px-6">
        {features.map((f) => (
          <div
            key={f.title}
            className="flex-shrink-0 w-[220px] sm:w-[260px] bg-[#1A1A2E] border border-white/10 p-8 hover:border-[#FF006E]/30 transition-all group"
          >
            <div className={`text-3xl mb-4 group-hover:scale-110 transition-transform inline-block`}>
              {f.emoji}
            </div>
            <h3 className="display text-xl tracking-wider text-white mb-2">{f.title}</h3>
            <p className="font-body text-sm text-gray-400 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;
