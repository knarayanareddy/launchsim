import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsStrip from "@/components/StatsStrip";
import HowItWorksSection from "@/components/HowItWorksSection";
import CapabilitiesSection from "@/components/CapabilitiesSection";
import PersonaShowcase from "@/components/PersonaShowcase";
import SocialProofCTA from "@/components/SocialProofCTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen scroll-smooth bg-background">
      <SEO path="/" />
      <Navbar />
      <HeroSection />
      <StatsStrip />
      <HowItWorksSection />
      <CapabilitiesSection />
      <PersonaShowcase />
      <SocialProofCTA />
      <Footer />
    </div>
  );
};

export default Index;
