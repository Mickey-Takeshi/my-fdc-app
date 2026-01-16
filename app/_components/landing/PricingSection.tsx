import Link from 'next/link';
import { Check } from 'lucide-react';

const PLANS = [
  {
    name: 'フリー',
    price: '0',
    description: '個人やお試しに最適',
    features: ['ワークスペース1つ', 'メンバー3人まで', '基本機能すべて'],
    recommended: false,
  },
  {
    name: 'スタンダード',
    price: '3,000',
    description: '成長中のチームに',
    features: ['ワークスペース無制限', 'メンバー10人まで', '高度な分析機能', '優先サポート'],
    recommended: true,
  },
  {
    name: 'プロ',
    price: '10,000',
    description: '本格的なビジネスに',
    features: ['すべての機能', 'メンバー無制限', 'API連携', '専任サポート', 'SLA保証'],
    recommended: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" style={{ padding: '100px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '36px', fontWeight: 700, marginBottom: '16px' }}>
          料金プラン
        </h2>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '60px', fontSize: '18px' }}>
          あなたのビジネスに合ったプランをお選びください
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              style={{
                background: plan.recommended ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'white',
                color: plan.recommended ? 'white' : '#111827',
                padding: '40px 32px',
                borderRadius: '20px',
                boxShadow: plan.recommended ? '0 20px 40px rgba(102, 126, 234, 0.3)' : '0 4px 20px rgba(0,0,0,0.05)',
                border: plan.recommended ? 'none' : '1px solid #e5e7eb',
                position: 'relative',
              }}
            >
              {plan.recommended && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#fbbf24',
                    color: '#111827',
                    padding: '4px 16px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  おすすめ
                </span>
              )}
              <h3 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>{plan.name}</h3>
              <p style={{ opacity: 0.8, marginBottom: '20px', fontSize: '14px' }}>{plan.description}</p>
              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '48px', fontWeight: 800 }}>¥{plan.price}</span>
                <span style={{ opacity: 0.7 }}>/月</span>
              </div>
              <ul style={{ listStyle: 'none', marginBottom: '32px', padding: 0 }}>
                {plan.features.map((feature) => (
                  <li key={feature} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <Check size={20} />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  background: plan.recommended ? 'white' : 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: plan.recommended ? '#667eea' : 'white',
                  padding: '14px 24px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                始める
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
