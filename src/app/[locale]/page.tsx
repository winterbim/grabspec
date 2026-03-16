'use client';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/landing/Hero';
import { BrandBar } from '@/components/landing/BrandBar';
import { Features } from '@/components/landing/Features';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { CTASection } from '@/components/landing/CTASection';

export default function LandingPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Header />
      <main>
        <Hero />
        <BrandBar />
        <Features />
        <HowItWorks />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
