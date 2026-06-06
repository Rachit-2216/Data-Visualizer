'use client';

import { AIAnalystPanel } from './ai-analyst-panel';
import { EasterEggs } from './easter-eggs';
import { FinalCTA } from './final-cta';
import { FormatWall } from './format-wall';
import { HeroLab } from './hero-lab';
import { LandingNav } from './landing-nav';
import { MLLabSection } from './ml-lab-section';
import { ProductProof } from './product-proof';
import { ScrollPhoenixJourney } from './scroll-phoenix-journey';

export function LandingShell() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#05060a] text-white selection:bg-lime-300 selection:text-[#05060a]">
      <LandingNav />
      <EasterEggs />
      <HeroLab />
      <ScrollPhoenixJourney />
      <FormatWall />
      <AIAnalystPanel />
      <MLLabSection />
      <ProductProof />
      <FinalCTA />
    </main>
  );
}
