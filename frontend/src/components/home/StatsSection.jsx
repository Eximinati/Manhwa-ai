const StatsSection = () => {
  return (
    <section className="relative z-10 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="border-t border-b border-white/10 py-10 flex flex-wrap items-center justify-center gap-x-16 gap-y-6">
          {[
            { value: "10,000+", label: "Videos generated" },
            { value: "50,000+", label: "Panels extracted" },
            { value: "5+", label: "Languages" },
            { value: "99%", label: "Satisfaction" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="display text-3xl sm:text-4xl text-white">{s.value}</div>
              <div className="font-body text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
