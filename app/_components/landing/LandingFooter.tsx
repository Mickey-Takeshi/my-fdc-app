import Link from 'next/link';

export function LandingFooter() {
  return (
    <footer style={{ background: '#111827', color: 'white', padding: '60px 24px 40px' }}>
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '40px',
        }}
      >
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>FDC</h3>
          <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: 1.6 }}>
            スタートアップの成長を加速するオールインワンプラットフォーム
          </p>
        </div>
        <div>
          <h4 style={{ fontWeight: 600, marginBottom: '16px' }}>プロダクト</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', padding: 0 }}>
            <li><a href="#features" style={{ color: '#9ca3af', textDecoration: 'none' }}>機能</a></li>
            <li><a href="#pricing" style={{ color: '#9ca3af', textDecoration: 'none' }}>料金</a></li>
            <li><a href="#faq" style={{ color: '#9ca3af', textDecoration: 'none' }}>FAQ</a></li>
          </ul>
        </div>
        <div>
          <h4 style={{ fontWeight: 600, marginBottom: '16px' }}>リソース</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', padding: 0 }}>
            <li><Link href="/login" style={{ color: '#9ca3af', textDecoration: 'none' }}>ログイン</Link></li>
            <li><a href="#contact" style={{ color: '#9ca3af', textDecoration: 'none' }}>お問い合わせ</a></li>
          </ul>
        </div>
      </div>
      <div
        style={{
          maxWidth: '1200px',
          margin: '40px auto 0',
          paddingTop: '24px',
          borderTop: '1px solid #374151',
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '14px',
        }}
      >
        © {new Date().getFullYear()} FDC. All rights reserved.
      </div>
    </footer>
  );
}
