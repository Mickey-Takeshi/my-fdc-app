'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    question: '無料プランでどこまで使えますか？',
    answer:
      '基本機能はすべてご利用いただけます。ワークスペース1つ、メンバー3人までの制限があります。',
  },
  {
    question: 'いつでもプランを変更できますか？',
    answer:
      'はい、いつでもアップグレード・ダウングレードが可能です。変更は即座に反映されます。',
  },
  {
    question: 'データのエクスポートはできますか？',
    answer:
      'すべてのプランでCSV形式でのエクスポートが可能です。プロプランではAPI経由でのアクセスも可能です。',
  },
  {
    question: 'セキュリティ対策はどうなっていますか？',
    answer:
      'すべての通信はSSL/TLSで暗号化され、データは定期的にバックアップされます。',
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      style={{ padding: '100px 24px', background: '#f9fafb' }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2
          id="faq-heading"
          style={{ textAlign: 'center', fontSize: '36px', fontWeight: 700, marginBottom: '60px' }}
        >
          よくある質問
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            const panelId = `faq-panel-${index}`;
            const buttonId = `faq-button-${index}`;

            return (
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
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
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
                    aria-hidden="true"
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform 0.2s',
                    }}
                  />
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  hidden={!isOpen}
                  style={{ padding: isOpen ? '0 24px 20px' : '0', color: '#6b7280', lineHeight: 1.6 }}
                >
                  {faq.answer}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
