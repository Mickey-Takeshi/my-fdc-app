/**
 * 使い方ガイド表示コンポーネント
 */

'use client';

import { memo } from 'react';
import { Lightbulb } from 'lucide-react';

export const UsageGuide = memo(function UsageGuide() {
  return (
    <div
      style={{
        padding: '16px',
        background: 'linear-gradient(135deg, var(--primary-alpha-08) 0%, var(--primary-alpha-05) 100%)',
        borderLeft: '4px solid var(--primary)',
        borderRadius: '8px',
        marginBottom: '20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <Lightbulb size={20} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '14px', color: 'var(--text-dark)', lineHeight: 1.7 }}>
          <strong>3ステップで初期設定完了</strong>
          <br />
          1. 「テンプレート」をダウンロード → ChatGPT/Claudeに添付
          <br />
          2. 「プロンプトをコピー」→ ビジネス情報を記入して送信
          <br />
          3. 生成されたCSVを保存して「インポート」
        </div>
      </div>
    </div>
  );
});
