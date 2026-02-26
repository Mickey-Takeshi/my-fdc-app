import Link from 'next/link';

export function HeroSection() {
  return (
    <section
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        textAlign: 'center',
        padding: '120px 24px 80px',
      }}
    >
      <div style={{ maxWidth: '800px' }}>
        <h1
          style={{
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 800,
            marginBottom: '24px',
            lineHeight: 1.2,
          }}
        >
          スタートアップの成長を
          <br />
          加速するプラットフォーム
        </h1>
        <p
          style={{
            fontSize: 'clamp(16px, 2vw, 20px)',
            opacity: 0.9,
            marginBottom: '40px',
            lineHeight: 1.6,
          }}
        >
          OKR管理、顧客管理、タスク管理を一つに。
          <br />
          シンプルで使いやすいツールで、ビジネスを次のステージへ。
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/login"
            style={{
              background: 'white',
              color: '#667eea',
              padding: '16px 32px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '18px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              textDecoration: 'none',
            }}
          >
            無料で始める
          </Link>
          <a
            href="#features"
            style={{
              background: 'transparent',
              color: 'white',
              padding: '16px 32px',
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '18px',
              border: '2px solid rgba(255,255,255,0.5)',
              textDecoration: 'none',
            }}
          >
            詳しく見る
          </a>
        </div>
      </div>
    </section>
  );
}
