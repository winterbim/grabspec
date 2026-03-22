'use client';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/landing/Hero';
import { SearchTicker } from '@/components/landing/SearchTicker';
import { BrandBar } from '@/components/landing/BrandBar';
import { Features } from '@/components/landing/Features';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { ManufacturersChart } from '@/components/landing/ManufacturersChart';
import { CTASection } from '@/components/landing/CTASection';
import { TrustSection } from '@/components/landing/TrustSection';

export default function LandingPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Header />
      <main>
        <Hero />
        <SearchTicker />
        <BrandBar />
        <Features />
        <HowItWorks />
        <TrustSection />
        <ManufacturersChart />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
