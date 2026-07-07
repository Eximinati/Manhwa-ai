const Watermark = ({ text, sub }) => (
  <div className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden">
    {/* Primary Japanese watermark — massive ghost text */}
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="display text-[22vw] sm:text-[18vw] md:text-[15vw] text-white/[0.02] tracking-tight leading-none whitespace-nowrap">
        {text}
      </span>
    </div>

    {/* Secondary watermark */}
    {sub && (
      <div className="absolute inset-0 flex items-center justify-center mt-[8vw]">
        <span className="display text-[10vw] sm:text-[8vw] md:text-[6vw] text-white/[0.015] tracking-tight leading-none whitespace-nowrap">
          {sub}
        </span>
      </div>
    )}

    {/* ARI D AKU signature — vertical on right edge */}
    <div className="absolute top-1/2 -translate-y-1/2 right-4 sm:right-6 hidden sm:block">
      <div className="flex flex-col items-center gap-1">
        <span className="display text-[8px] text-white/[0.04] tracking-[0.4em] [writing-mode:vertical-rl]">
          ARI D AKU
        </span>
        <span className="font-body text-[6px] text-white/[0.03] tracking-[0.3em] [writing-mode:vertical-rl] mt-2">
          アリ・ディ・アク
        </span>
      </div>
    </div>

    {/* ARI D AKU bottom-left on mobile */}
    <div className="absolute bottom-6 left-4 sm:hidden">
      <div className="display text-[8px] text-white/[0.04] tracking-[0.3em]">ARI D AKU</div>
      <div className="font-body text-[6px] text-white/[0.03] tracking-[0.2em]">アリ・ディ・アク</div>
    </div>
  </div>
);

export default Watermark;
