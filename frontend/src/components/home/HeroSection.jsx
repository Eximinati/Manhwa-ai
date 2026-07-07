import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative z-10 min-h-screen flex items-center justify-center px-6 overflow-hidden">
      {/* Speed lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-0 w-[200%] h-px bg-gradient-to-r from-transparent via-[#FF006E]/10 to-transparent animate-speed-line" />
        <div className="absolute top-[50%] left-0 w-[200%] h-px bg-gradient-to-r from-transparent via-[#00F5D4]/8 to-transparent animate-speed-line" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[70%] left-0 w-[200%] h-px bg-gradient-to-r from-transparent via-[#FFD60A]/8 to-transparent animate-speed-line" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 text-center max-w-5xl mx-auto">
        <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <span className="magazine-kicker text-xs tracking-[0.3em]">AI-Powered Manga to Video</span>
        </div>

        <h1 className="display text-[14vw] sm:text-[10vw] md:text-[8vw] leading-[0.9] text-white mt-4 mb-6 animate-fade-up" style={{ animationDelay: '0.2s' }}>
          MANHWA
          <br />
          <span className="text-[#FF006E]">AI</span>
        </h1>

        <p className="font-body text-sm sm:text-base md:text-lg text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed animate-fade-up" style={{ animationDelay: '0.4s' }}>
          Drop a manga PDF. Get a narrated video. No editing required.
        </p>

        <div className="animate-fade-up" style={{ animationDelay: '0.6s' }}>
          <button
            onClick={() => navigate("/upload")}
            className="px-10 py-4 display text-lg tracking-wider text-white bg-[#FF006E] hover:bg-[#FF006E]/80 transition-all active:scale-[0.97]"
          >
            Upload Your Manga
          </button>
          <p className="font-body text-xs text-gray-600 mt-4">Free to try — no account needed</p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
