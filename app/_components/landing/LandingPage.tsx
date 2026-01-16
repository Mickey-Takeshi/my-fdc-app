'use client';

import { LandingHeader } from './LandingHeader';
import { HeroSection } from './HeroSection';
import { FeaturesSection } from './FeaturesSection';
import { PricingSection } from './PricingSection';
import { FAQSection } from './FAQSection';
import { ContactSection } from './ContactSection';
import { LandingFooter } from './LandingFooter';

const skipLinkHidden = { position: 'absolute' as const, left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' as const };
const skipLinkVisible = { position: 'fixed' as const, top: '10px', left: '10px', width: 'auto', height: 'auto', padding: '12px 24px', background: '#667eea', color: 'white', borderRadius: '8px', zIndex: 9999, textDecoration: 'none' };

export function LandingPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <a
        href="#main-content"
        style={skipLinkHidden}
        onFocus={(e) => Object.assign(e.currentTarget.style, skipLinkVisible)}
        onBlur={(e) => Object.assign(e.currentTarget.style, skipLinkHidden)}
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
