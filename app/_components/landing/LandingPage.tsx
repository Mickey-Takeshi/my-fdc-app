'use client';

import { LandingHeader } from './LandingHeader';
import { HeroSection } from './HeroSection';
import { FeaturesSection } from './FeaturesSection';
import { PricingSection } from './PricingSection';
import { FAQSection } from './FAQSection';
import { ContactSection } from './ContactSection';
import { LandingFooter } from './LandingFooter';

export function LandingPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Skip link for keyboard navigation */}
      <a
        href="#main-content"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 'auto',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
        onFocus={(e) => {
          e.currentTarget.style.position = 'fixed';
          e.currentTarget.style.top = '10px';
          e.currentTarget.style.left = '10px';
          e.currentTarget.style.width = 'auto';
          e.currentTarget.style.height = 'auto';
          e.currentTarget.style.padding = '12px 24px';
          e.currentTarget.style.background = '#667eea';
          e.currentTarget.style.color = 'white';
          e.currentTarget.style.borderRadius = '8px';
          e.currentTarget.style.zIndex = '9999';
          e.currentTarget.style.textDecoration = 'none';
        }}
        onBlur={(e) => {
          e.currentTarget.style.position = 'absolute';
          e.currentTarget.style.left = '-9999px';
          e.currentTarget.style.width = '1px';
          e.currentTarget.style.height = '1px';
        }}
      >
        メインコンテンツへスキップ
      </a>
      <LandingHeader />
      <main id="main-content">
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <FAQSection />
        <ContactSection />
      </main>
      <LandingFooter />
    </div>
  );
}
