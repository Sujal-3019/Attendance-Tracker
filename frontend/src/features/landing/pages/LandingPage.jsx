import LandingFooter from "../components/LandingFooter";
import LandingNavbar from "../components/LandingNavbar";
import FeatureSection from "../components/FeatureSection";
import HeroSection from "../components/HeroSection";

function LandingPage() {
  return (
    <div className="min-h-screen">
      <LandingNavbar />

      <main>
        <HeroSection />
        <FeatureSection />
      </main>

      <LandingFooter />
    </div>
  );
}

export default LandingPage;