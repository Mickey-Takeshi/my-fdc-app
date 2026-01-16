'use client';

import Link from 'next/link';

export function LandingHeader() {
  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #e5e7eb',
        zIndex: 1000,
        padding: '16px 24px',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Link href="/" style={{ fontWeight: 700, fontSize: '20px', color: '#667eea' }}>
          FDC
        </Link>
        <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <a href="#features" style={{ color: '#4b5563', textDecoration: 'none' }}>機能</a>
          <a href="#pricing" style={{ color: '#4b5563', textDecoration: 'none' }}>料金</a>
          <a href="#faq" style={{ color: '#4b5563', textDecoration: 'none' }}>FAQ</a>
          <a href="#contact" style={{ color: '#4b5563', textDecoration: 'none' }}>お問い合わせ</a>
          <Link
            href="/login"
            style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              padding: '8px 20px',
              borderRadius: '8px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            ログイン
          </Link>
        </nav>
      </div>
    </header>
  );
}
