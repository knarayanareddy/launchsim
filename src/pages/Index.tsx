import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import AgentPreviewSection from "@/components/AgentPreviewSection";
import ChartPreviewSection from "@/components/ChartPreviewSection";
import CTASection from "@/components/CTASection";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <AgentPreviewSection />
      <ChartPreviewSection />
      <CTASection />
    </div>
  );
};

export default Index;
