const AboutSection = () => {
  const stats = [
    { value: "10K+", label: "videos" },
    { value: "50K+", label: "panels" },
    { value: "5", label: "languages" },
    { value: "99%", label: "uptime" },
  ];

  return (
    <section className="relative z-10 py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-start">
          {/* Left: editorial text */}
          <div>
            <span className="magazine-kicker">About</span>
            <h2 className="display text-5xl sm:text-6xl md:text-7xl leading-[1] text-white mt-4 mb-8">
              Manga to<br />
              <span className="text-[#FF006E]">video</span>
              , instantly
            </h2>
            <span className="magazine-rule mb-8 block" />
            <p className="font-body text-sm sm:text-base text-gray-400 leading-relaxed max-w-md">
              ManhwaAI extracts panels, generates narration in your language, and compiles a 
              polished video — all automatically. Built for creators who want to publish 
              manga content without spending hours editing.
            </p>
          </div>

          {/* Right: stat grid */}
          <div className="grid grid-cols-2 gap-6">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="display text-5xl sm:text-6xl text-white leading-none mb-1">{s.value}</div>
                <div className="font-body text-xs text-gray-500 tracking-wider uppercase">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
