import { Zap, Film, Upload, PlayCircle, Download, Sparkles, CheckCircle, Settings } from 'lucide-react';
import Watermark from "../components/Watermark";

const Section = ({ icon: Icon, title, id, children }) => (
  <div id={id} className="scroll-mt-20 mb-20">
    <div className="flex items-center gap-3 mb-6">
      <Icon className="w-5 h-5 text-[#FF006E]" />
      <h2 className="display text-2xl sm:text-3xl tracking-wider text-white">{title}</h2>
    </div>
    <div className="space-y-4 font-body text-sm text-gray-300 leading-relaxed">
      {children}
    </div>
  </div>
);

const navLinks = [
  { id: 'overview', title: 'Overview' },
  { id: 'features', title: 'Features' },
  { id: 'how-it-works', title: 'How It Works' },
  { id: 'getting-started', title: 'Getting Started' },
  { id: 'tips', title: 'Tips' },
];

const DocumentationPage = () => {
  const handleNavClick = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <main className="min-h-screen bg-[#0A0A1A] text-white px-6 py-16 relative">
      <Watermark text="指南" sub="GUIDE" />
      <div className="max-w-5xl mx-auto">
        <div className="mb-16">
          <span className="magazine-kicker">Docs</span>
          <h1 className="display text-5xl sm:text-6xl text-white mt-1">
            Guide
          </h1>
          <p className="font-body text-sm text-gray-500 mt-2 max-w-md">
            Everything you need to know about using ManhwaAI.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-12">
          {/* Side nav */}
          <nav className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-24 space-y-1">
              {navLinks.map((link) => (
                <button key={link.id} onClick={() => handleNavClick(link.id)}
                  className="block w-full text-left px-3 py-2 font-body text-sm text-gray-500 hover:text-white transition-colors">
                  {link.title}
                </button>
              ))}
            </div>
          </nav>

          {/* Content */}
          <div className="lg:col-span-3">
            <Section id="overview" icon={Zap} title="Overview">
              <p><strong className="text-[#FF006E]">ManhwaAI</strong> transforms manga PDFs into narrated videos. Upload, configure, and download — the AI handles the rest.</p>
              <div className="grid grid-cols-3 gap-3 mt-4">
                {["Automated", "AI-Powered", "Fast"].map((l) => (
                  <div key={l} className="flex items-center gap-2 p-3 border border-white/10">
                    <CheckCircle className="w-4 h-4 text-[#00F5D4]" />
                    <span className="font-body text-xs font-semibold">{l}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="features" icon={Film} title="Features">
              <div className="space-y-4">
                {[
                  ["Panel Extraction", "AI extracts individual panels from your PDF, preserving quality and order."],
                  ["Story Generation", "Google Gemini analyzes each panel and generates contextual narration."],
                  ["Text-to-Speech", "Natural voice synthesis synced to panel transitions."],
                  ["Video Compilation", "Browser-based rendering with smooth pan, zoom, and fade effects."],
                  ["Multi-language", "Narrate in Hinglish, Hindi, or English."],
                ].map(([t, d]) => (
                  <div key={t} className="border-l-2 border-[#FF006E] pl-4">
                    <h4 className="font-body text-sm font-semibold text-white">{t}</h4>
                    <p className="font-body text-sm text-gray-400">{d}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="how-it-works" icon={PlayCircle} title="How It Works">
              <div className="space-y-6">
                {[
                  { icon: Upload, title: "1. Upload", desc: "Drop your manga PDF and choose language, direction, and orientation." },
                  { icon: Zap, title: "2. AI Processing", desc: "Backend extracts panels, generates narration, and creates audio." },
                  { icon: Film, title: "3. Preview", desc: "Review extracted panels, remove unwanted ones, edit the script." },
                  { icon: PlayCircle, title: "4. Generate Video", desc: "Your browser compiles everything into an MP4 video." },
                  { icon: Download, title: "5. Download", desc: "Save and share your narrated manga video." },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.title} className="flex items-start gap-4">
                      <Icon className="w-5 h-5 text-[#FF006E] mt-0.5" />
                      <div>
                        <h4 className="font-body text-sm font-semibold text-white">{s.title}</h4>
                        <p className="font-body text-sm text-gray-400">{s.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>

            <Section id="getting-started" icon={Upload} title="Getting Started">
              <div className="space-y-6">
                {[
                  ["Prepare", "Use a high-resolution PDF (300 DPI+). 10-15 pages recommended for best results."],
                  ["Upload", "Navigate to the Upload page and drop your file. Configure settings."],
                  ["Wait", "AI processing takes 1-3 minutes depending on file size. Keep the tab open."],
                  ["Generate", "Preview panels, edit the script, then click Generate Video."],
                  ["Download", "Once rendered, download your MP4 and share it anywhere."],
                ].map(([t, d]) => (
                  <div key={t}>
                    <h4 className="font-body text-sm font-semibold text-white">{t}</h4>
                    <p className="font-body text-sm text-gray-400">{d}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="tips" icon={Settings} title="Tips">
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  ["High-quality PDFs", "300 DPI+ for best panel extraction and AI narration."],
                  ["Keep tab active", "Video rendering happens in-browser. Don't switch tabs."],
                  ["Remove bad panels", "Use the preview step to delete poorly extracted panels."],
                  ["Edit the script", "Tweak AI narration before rendering for better results."],
                  ["Try different languages", "Experiment with Hinglish, Hindi, or English narration."],
                  ["Stable connection", "Ensure reliable internet during upload and processing."],
                ].map(([t, d]) => (
                  <div key={t} className="border border-white/10 p-4">
                    <h4 className="font-body text-xs font-semibold text-white mb-1">{t}</h4>
                    <p className="font-body text-xs text-gray-400">{d}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-[#1A1A2E] border border-[#FFD60A]/20">
                <h4 className="font-body text-sm font-semibold text-[#FFD60A] mb-2">⚡ Pro tips</h4>
                <div className="space-y-2">
                  {[
                    "Add background music after download for more engagement.",
                    "Process chapters as a series with consistent naming.",
                    "Test different genres to see how the AI adapts narration style.",
                  ].map((t) => (
                    <div key={t} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#00F5D4] mt-0.5" />
                      <p className="font-body text-xs text-gray-300">{t}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          </div>
        </div>
      </div>
    </main>
  );
};

export default DocumentationPage;
