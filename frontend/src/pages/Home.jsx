import AnimatedBackground from "../components/home/AnimatedBackground";
import HeroSection from "../components/home/HeroSection";
import AboutSection from "../components/home/AboutSection";
import VideoCarousel from "../components/home/VideoCarousel";
import StatsSection from "../components/home/StatsSection";
import FeaturesSection from "../components/home/FeaturesSection";
import PricingSection from "../components/home/PricingSection";
import CTASection from "../components/home/CTASection";
import Watermark from "../components/Watermark";

const ManhwaAIHome = () => (
  <div className="bg-[#0A0A1A] text-white overflow-hidden relative">
    <AnimatedBackground />
    <Watermark text="漫画AI" sub="MANHWA AI" />
    <HeroSection />
    <AboutSection />
    <VideoCarousel />
    <StatsSection />
    <FeaturesSection />
    <PricingSection />
    <CTASection />
  </div>
);

export default ManhwaAIHome;
