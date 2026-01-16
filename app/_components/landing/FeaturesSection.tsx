import { Target, Users, CheckSquare, Map, Sparkles, LayoutGrid } from 'lucide-react';

const FEATURES = [
  { icon: Target, title: 'OKR管理', description: '目標と成果指標を設定し、チーム全体の方向性を揃えます。' },
  { icon: Users, title: 'リード・顧客管理', description: '見込み客から顧客への転換を効率的に管理します。' },
  { icon: CheckSquare, title: 'タスク管理', description: 'チームのタスクを可視化し、進捗を追跡します。' },
  { icon: Map, title: 'ActionMap', description: '戦略からアクションまでを視覚的にマッピングします。' },
  { icon: Sparkles, title: 'ブランド管理', description: 'ブランドのMVVやポイントを一元管理します。' },
  { icon: LayoutGrid, title: 'Lean Canvas', description: 'ビジネスモデルを9つの要素で整理します。' },
];

export function FeaturesSection() {
  return (
    <section id="features" style={{ padding: '100px 24px', background: '#f9fafb' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '36px', fontWeight: 700, marginBottom: '16px', color: '#111827' }}>
          主な機能
        </h2>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '60px', fontSize: '18px' }}>
          スタートアップに必要な機能をすべて揃えています
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                style={{
                  background: 'white',
                  padding: '32px',
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                  }}
                >
                  <Icon size={28} color="white" />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>{feature.title}</h3>
                <p style={{ color: '#6b7280', lineHeight: 1.6 }}>{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
