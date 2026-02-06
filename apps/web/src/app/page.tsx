'use client';

import {
  ScrollProvider,
  useScroll,
  Navbar,
  HeroSection,
  FeatureShowcase,
  StatsSection,
  HowItWorksSection,
  CTASection,
  Footer,
  PerformanceMonitor,
} from '@/components/landing';

function LandingPageContent() {
  const { scrollProgress, isReady } = useScroll();

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <HeroSection scrollProgress={scrollProgress} />
      <FeatureShowcase />
      <StatsSection />
      <HowItWorksSection />
      <CTASection />
      <Footer />
      <PerformanceMonitor />
    </>
  );
}

export default function LandingPage() {
  return (
    <ScrollProvider>
      <main className="relative bg-[#030712] overflow-x-hidden">
        <LandingPageContent />
      </main>
    </ScrollProvider>
  );
}
