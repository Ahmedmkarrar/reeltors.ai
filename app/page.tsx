import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { Ticker } from '@/components/landing/Ticker';
import { DemoSection } from '@/components/landing/DemoSection';
import { BrokerageLogos } from '@/components/landing/BrokerageLogos';
import { PainSection } from '@/components/landing/PainSection';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { ROICalculator } from '@/components/landing/ROICalculator';
import { ValueStack } from '@/components/landing/ValueStack';
import { Comparison } from '@/components/landing/Comparison';
import { Pricing } from '@/components/landing/Pricing';
import { FAQ } from '@/components/landing/FAQ';
import { Footer } from '@/components/landing/Footer';
import { StickyCTA } from '@/components/landing/StickyCTA';
import { CursorGlow } from '@/components/landing/CursorGlow';

export default function LandingPage() {
  return (
    <main className="relative min-h-screen bg-[#0D0B08]">
      <CursorGlow />
      <Navbar />
      <Hero />
      <Ticker />
      <DemoSection />
      <BrokerageLogos />
      <PainSection />
      <HowItWorks />
      <ROICalculator />
      <ValueStack />
      <Comparison />
      <Pricing />
      <FAQ />
<Footer />
      {/* Floating UI */}
      <StickyCTA />
    </main>
  );
}
