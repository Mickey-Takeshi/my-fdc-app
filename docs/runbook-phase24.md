# Phase 24: ランディングページ（LP）実装ランブック

**Phase 24: LP作成・未ログイン時表示・お問い合わせフォーム**

---

## 0. 前提条件

- [ ] Phase 23 完了（PWA設定済み）
- [ ] Node.js >= 22.22.0

---

## 1. このPhaseで習得する概念

| 概念 | 説明 |
|------|------|
| **ランディングページ (LP)** | ユーザーが最初に訪れるページ。サービス紹介とCTA |
| **CTA (Call To Action)** | 「無料で始める」など、ユーザーに行動を促すボタン |
| **ISR** | Incremental Static Regeneration。静的ページを定期的に再生成 |
| **OGP** | Open Graph Protocol。SNSシェア時の画像・タイトル設定 |

### LPの構成要素

| セクション | 目的 |
|-----------|------|
| Hero | キャッチコピーとCTAで第一印象を与える |
| Features | サービスの主要機能を紹介 |
| Pricing | 料金プランを表示 |
| FAQ | よくある質問に回答 |
| Contact | お問い合わせフォーム |

---

## Step 1: LPコンポーネントの作成

### 1.1 ディレクトリ構成

```
app/_components/landing/
├── LandingPage.tsx      # メインLP
├── HeroSection.tsx      # ヒーローセクション
├── FeaturesSection.tsx  # 機能紹介
├── PricingSection.tsx   # 料金プラン
├── FAQSection.tsx       # よくある質問
├── ContactSection.tsx   # お問い合わせ
├── LandingHeader.tsx    # LPヘッダー
└── LandingFooter.tsx    # LPフッター
```

### 1.2 LandingHeader コンポーネント

**ファイル: `app/_components/landing/LandingHeader.tsx`**

```typescript
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
          <a href="#features" style={{ color: '#4b5563' }}>機能</a>
          <a href="#pricing" style={{ color: '#4b5563' }}>料金</a>
          <a href="#faq" style={{ color: '#4b5563' }}>FAQ</a>
          <a href="#contact" style={{ color: '#4b5563' }}>お問い合わせ</a>
          <Link
            href="/login"
            style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              padding: '8px 20px',
              borderRadius: '8px',
              fontWeight: 600,
            }}
          >
            ログイン
          </Link>
        </nav>
      </div>
    </header>
  );
}
```

### 1.3 HeroSection コンポーネント

**ファイル: `app/_components/landing/HeroSection.tsx`**

```typescript
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
            }}
          >
            詳しく見る
          </a>
        </div>
      </div>
    </section>
  );
}
```

### 1.4 FeaturesSection コンポーネント

**ファイル: `app/_components/landing/FeaturesSection.tsx`**

```typescript
import { Target, Users, CheckSquare, Map, Sparkles, LayoutGrid } from 'lucide-react';

const FEATURES = [
  {
    icon: Target,
    title: 'OKR管理',
    description: '目標と成果指標を設定し、チーム全体の方向性を揃えます。',
  },
  {
    icon: Users,
    title: 'リード・顧客管理',
    description: '見込み客から顧客への転換を効率的に管理します。',
  },
  {
    icon: CheckSquare,
    title: 'タスク管理',
    description: 'チームのタスクを可視化し、進捗を追跡します。',
  },
  {
    icon: Map,
    title: 'ActionMap',
    description: '戦略からアクションまでを視覚的にマッピングします。',
  },
  {
    icon: Sparkles,
    title: 'ブランド管理',
    description: 'ブランドのMVVやポイントを一元管理します。',
  },
  {
    icon: LayoutGrid,
    title: 'Lean Canvas',
    description: 'ビジネスモデルを9つの要素で整理します。',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" style={{ padding: '100px 24px', background: '#f9fafb' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h2
          style={{
            textAlign: 'center',
            fontSize: '36px',
            fontWeight: 700,
            marginBottom: '16px',
            color: '#111827',
          }}
        >
          主な機能
        </h2>
        <p
          style={{
            textAlign: 'center',
            color: '#6b7280',
            marginBottom: '60px',
            fontSize: '18px',
          }}
        >
          スタートアップに必要な機能をすべて揃えています
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '32px',
          }}
        >
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
                <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>
                  {feature.title}
                </h3>
                <p style={{ color: '#6b7280', lineHeight: 1.6 }}>{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

### 1.5 PricingSection コンポーネント

**ファイル: `app/_components/landing/PricingSection.tsx`**

```typescript
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
        <h2
          style={{
            textAlign: 'center',
            fontSize: '36px',
            fontWeight: 700,
            marginBottom: '16px',
          }}
        >
          料金プラン
        </h2>
        <p
          style={{
            textAlign: 'center',
            color: '#6b7280',
            marginBottom: '60px',
            fontSize: '18px',
          }}
        >
          あなたのビジネスに合ったプランをお選びください
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '32px',
          }}
        >
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              style={{
                background: plan.recommended ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'white',
                color: plan.recommended ? 'white' : '#111827',
                padding: '40px 32px',
                borderRadius: '20px',
                boxShadow: plan.recommended
                  ? '0 20px 40px rgba(102, 126, 234, 0.3)'
                  : '0 4px 20px rgba(0,0,0,0.05)',
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
              <h3 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
                {plan.name}
              </h3>
              <p
                style={{
                  opacity: 0.8,
                  marginBottom: '20px',
                  fontSize: '14px',
                }}
              >
                {plan.description}
              </p>
              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '48px', fontWeight: 800 }}>¥{plan.price}</span>
                <span style={{ opacity: 0.7 }}>/月</span>
              </div>
              <ul style={{ listStyle: 'none', marginBottom: '32px' }}>
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '12px',
                    }}
                  >
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
```

### 確認ポイント

- [ ] `LandingHeader.tsx` が作成されている
- [ ] `HeroSection.tsx` が作成されている
- [ ] `FeaturesSection.tsx` が作成されている
- [ ] `PricingSection.tsx` が作成されている

---

## Step 2: FAQ・お問い合わせセクションの作成

### 2.1 FAQSection コンポーネント

**ファイル: `app/_components/landing/FAQSection.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    question: '無料プランでどこまで使えますか？',
    answer: '基本機能はすべてご利用いただけます。ワークスペース1つ、メンバー3人までの制限があります。',
  },
  {
    question: 'いつでもプランを変更できますか？',
    answer: 'はい、いつでもアップグレード・ダウングレードが可能です。変更は即座に反映されます。',
  },
  {
    question: 'データのエクスポートはできますか？',
    answer: 'すべてのプランでCSV形式でのエクスポートが可能です。プロプランではAPI経由でのアクセスも可能です。',
  },
  {
    question: 'セキュリティ対策はどうなっていますか？',
    answer: 'すべての通信はSSL/TLSで暗号化され、データは定期的にバックアップされます。SOC2準拠のインフラで運用しています。',
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" style={{ padding: '100px 24px', background: '#f9fafb' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2
          style={{
            textAlign: 'center',
            fontSize: '36px',
            fontWeight: 700,
            marginBottom: '60px',
          }}
        >
          よくある質問
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {FAQS.map((faq, index) => (
            <div
              key={index}
              style={{
                background: 'white',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                style={{
                  width: '100%',
                  padding: '20px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '16px',
                  fontWeight: 600,
                }}
              >
                {faq.question}
                <ChevronDown
                  size={20}
                  style={{
                    transform: openIndex === index ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.2s',
                  }}
                />
              </button>
              {openIndex === index && (
                <div style={{ padding: '0 24px 20px', color: '#6b7280', lineHeight: 1.6 }}>
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

### 2.2 ContactSection コンポーネント

**ファイル: `app/_components/landing/ContactSection.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

export function ContactSection() {
  const [formData, setFormData] = useState({
    companyName: '',
    name: '',
    email: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setStatus('success');
        setFormData({ companyName: '', name: '', email: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <section id="contact" style={{ padding: '100px 24px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2
          style={{
            textAlign: 'center',
            fontSize: '36px',
            fontWeight: 700,
            marginBottom: '16px',
          }}
        >
          お問い合わせ
        </h2>
        <p
          style={{
            textAlign: 'center',
            color: '#6b7280',
            marginBottom: '40px',
          }}
        >
          ご質問やご要望がございましたらお気軽にお問い合わせください
        </p>

        {status === 'success' ? (
          <div
            style={{
              background: '#dcfce7',
              color: '#166534',
              padding: '24px',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            お問い合わせありがとうございます。担当者より折り返しご連絡いたします。
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                会社名
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '16px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                お名前 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '16px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                メールアドレス <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '16px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                お問い合わせ内容 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                required
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '16px',
                  resize: 'vertical',
                }}
              />
            </div>
            {status === 'error' && (
              <div style={{ color: '#ef4444', fontSize: '14px' }}>
                送信に失敗しました。しばらく経ってからお試しください。
              </div>
            )}
            <button
              type="submit"
              disabled={status === 'sending'}
              style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                padding: '16px 32px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 600,
                fontSize: '16px',
                cursor: status === 'sending' ? 'not-allowed' : 'pointer',
                opacity: status === 'sending' ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Send size={20} />
              {status === 'sending' ? '送信中...' : '送信する'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
```

### 2.3 LandingFooter コンポーネント

**ファイル: `app/_components/landing/LandingFooter.tsx`**

```typescript
import Link from 'next/link';

export function LandingFooter() {
  return (
    <footer
      style={{
        background: '#111827',
        color: 'white',
        padding: '60px 24px 40px',
      }}
    >
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
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li><a href="#features" style={{ color: '#9ca3af' }}>機能</a></li>
            <li><a href="#pricing" style={{ color: '#9ca3af' }}>料金</a></li>
            <li><a href="#faq" style={{ color: '#9ca3af' }}>FAQ</a></li>
          </ul>
        </div>
        <div>
          <h4 style={{ fontWeight: 600, marginBottom: '16px' }}>リソース</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li><Link href="/login" style={{ color: '#9ca3af' }}>ログイン</Link></li>
            <li><a href="#contact" style={{ color: '#9ca3af' }}>お問い合わせ</a></li>
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
```

### 確認ポイント

- [ ] `FAQSection.tsx` が作成されている
- [ ] `ContactSection.tsx` が作成されている
- [ ] `LandingFooter.tsx` が作成されている

---

## Step 3: メインLPページの作成

### 3.1 LandingPage コンポーネント

**ファイル: `app/_components/landing/LandingPage.tsx`**

```typescript
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
      <LandingHeader />
      <main>
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
```

### 3.2 ルートページの更新

**ファイル: `app/page.tsx`**

```typescript
import { LandingPage } from '@/app/_components/landing/LandingPage';

export default function RootPage() {
  return <LandingPage />;
}
```

### 確認ポイント

- [ ] `LandingPage.tsx` が作成されている
- [ ] `app/page.tsx` がLPを表示するように更新されている

---

## Step 4: お問い合わせAPIの作成

### 4.1 Contact API エンドポイント

**ファイル: `app/api/contact/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const contactSchema = z.object({
  companyName: z.string().optional(),
  name: z.string().min(1, '名前は必須です'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  message: z.string().min(1, 'お問い合わせ内容は必須です'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = contactSchema.parse(body);

    // メール送信（Resend/SendGrid設定時に有効化）
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'noreply@yourdomain.com',
    //   to: process.env.CONTACT_NOTIFY_EMAIL,
    //   subject: '【お問い合わせ】新規お問い合わせがありました',
    //   html: `
    //     <h2>新規お問い合わせ</h2>
    //     <p><strong>会社名:</strong> ${data.companyName || '未入力'}</p>
    //     <p><strong>お名前:</strong> ${data.name}</p>
    //     <p><strong>メール:</strong> ${data.email}</p>
    //     <p><strong>お問い合わせ内容:</strong></p>
    //     <p>${data.message.replace(/\n/g, '<br>')}</p>
    //   `,
    // });

    // ログ出力（開発時）
    console.log('[Contact] New inquiry:', {
      companyName: data.companyName,
      name: data.name,
      email: data.email,
      message: data.message.substring(0, 100),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('[Contact] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 4.2 メール送信の有効化（オプション）

Resendを使用する場合:

```bash
npm install resend
```

環境変数を設定:

```env
RESEND_API_KEY=re_xxxxxxxx
CONTACT_NOTIFY_EMAIL=your-email@example.com
```

### 確認ポイント

- [ ] `app/api/contact/route.ts` が作成されている
- [ ] Zodバリデーションが設定されている

---

## Step 5: OGPメタデータの設定

### 5.1 ルートレイアウトにOGP追加

**ファイル: `app/layout.tsx` の metadata を更新**

```typescript
export const metadata: Metadata = {
  title: 'FDC - スタートアップの成長を加速するプラットフォーム',
  description: 'OKR管理、顧客管理、タスク管理を一つに。シンプルで使いやすいツールで、ビジネスを次のステージへ。',
  manifest: '/manifest.json',
  openGraph: {
    title: 'FDC - スタートアップの成長を加速するプラットフォーム',
    description: 'OKR管理、顧客管理、タスク管理を一つに。',
    type: 'website',
    locale: 'ja_JP',
    siteName: 'FDC',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FDC - スタートアップの成長を加速するプラットフォーム',
    description: 'OKR管理、顧客管理、タスク管理を一つに。',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FDC',
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
};
```

### 確認ポイント

- [ ] OGPメタデータが設定されている
- [ ] Twitterカードが設定されている

---

## Step 6: 動作確認

### 6.1 開発サーバーで確認

```bash
npm run dev
# http://localhost:3000 でLPが表示される
```

### 6.2 確認項目

| 項目 | 確認方法 |
|------|----------|
| LP表示 | `/` にアクセスしてLPが表示される |
| ナビゲーション | ヘッダーのリンクが正しく動作する |
| CTAボタン | 「無料で始める」でログインページへ遷移 |
| お問い合わせ | フォーム送信でコンソールにログ出力 |
| レスポンシブ | モバイル表示が崩れていない |

### 6.3 ビルド確認

```bash
npm run build
npm run start
```

---

## トラブルシューティング

### LPが表示されない

```
Error: Unable to find LandingPage component
```

**解決方法:**
- `app/_components/landing/` ディレクトリが存在するか確認
- インポートパスが正しいか確認

### お問い合わせフォームが送信できない

**解決方法:**
- `/api/contact` エンドポイントが存在するか確認
- DevToolsのNetworkタブでエラーを確認

### OGPが反映されない

**解決方法:**
- ビルド後のHTMLでmeta tagが出力されているか確認
- SNSのデバッグツールでキャッシュをクリア

---

## 完了チェック

- [ ] LPコンポーネントがすべて作成されている
- [ ] `/` でLPが表示される
- [ ] CTAボタンからログインページへ遷移できる
- [ ] お問い合わせフォームが動作する
- [ ] OGPメタデータが設定されている
- [ ] ビルドが成功する
- [ ] GitHubにプッシュした

---

## 次のステップ

Phase 24 が完了したら、以下の拡張を検討：

1. **OGP画像の作成**: SNSシェア用の画像を作成
2. **アニメーション追加**: Framer Motionでスクロールアニメーション
3. **多言語対応**: i18nで英語版LPを追加
4. **A/Bテスト**: 異なるCTAコピーの効果測定

---

**Last Updated**: 2026-01-16
**Version**: Phase 24 v1.0
**Maintained by**: FDC Development Team (Human + Claude Code)
