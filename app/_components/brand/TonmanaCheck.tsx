/**
 * app/_components/brand/TonmanaCheck.tsx
 *
 * Phase 15: トーン&マナーチェックコンポーネント
 */

'use client';

import { useState } from 'react';
import { CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { useBrand } from '@/lib/contexts/BrandContext';
import { GlassCard } from './GlassCard';

export function TonmanaCheck() {
  const { currentBrand, getPointContent } = useBrand();
  const [inputText, setInputText] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    feedback: string[];
  } | null>(null);

  if (!currentBrand) return null;

  const toneVoice = getPointContent('tone_voice');
  const brandPersonality = getPointContent('brand_personality');
  const keyMessages = getPointContent('key_messages');

  const handleCheck = async () => {
    if (!inputText.trim()) return;

    setChecking(true);

    // シンプルなローカルチェック（実際のプロジェクトではAI APIを使用可能）
    await new Promise(resolve => setTimeout(resolve, 1000));

    const feedback: string[] = [];
    let score = 100;

    // トーン&ボイスが設定されているか
    if (!toneVoice) {
      feedback.push('トーン&ボイスが未設定です。設定することで一貫性チェックが可能になります。');
      score -= 20;
    }

    // ブランドパーソナリティが設定されているか
    if (!brandPersonality) {
      feedback.push('ブランドパーソナリティが未設定です。');
      score -= 10;
    }

    // キーメッセージが設定されているか
    if (!keyMessages) {
      feedback.push('キーメッセージが未設定です。');
      score -= 10;
    }

    // 入力テキストの長さチェック
    if (inputText.length < 20) {
      feedback.push('テキストが短すぎます。より詳細な文章でチェックすることをお勧めします。');
      score -= 15;
    }

    // トーンキーワードチェック（簡易版）
    if (toneVoice) {
      const toneKeywords = toneVoice.toLowerCase().split(/[、,\s]+/);
      const hasMatchingTone = toneKeywords.some(keyword =>
        keyword.length > 2 && inputText.toLowerCase().includes(keyword)
      );
      if (!hasMatchingTone && toneKeywords.filter(k => k.length > 2).length > 0) {
        feedback.push('設定されたトーン&ボイスのキーワードが含まれていません。');
        score -= 15;
      }
    }

    if (feedback.length === 0) {
      feedback.push('ブランドガイドラインに沿った良い文章です！');
    }

    setResult({ score: Math.max(0, score), feedback });
    setChecking(false);
  };

  return (
    <GlassCard>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Sparkles size={20} color="var(--primary)" />
        <h3 style={{ margin: 0, fontSize: '18px', color: 'white' }}>トーン&マナーチェック</h3>
      </div>

      <p style={{ margin: '0 0 16px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
        作成したコピーやメッセージがブランドガイドラインに沿っているかチェックします。
      </p>

      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="チェックしたいテキストを入力..."
        rows={4}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          background: 'rgba(255, 255, 255, 0.05)',
          color: 'white',
          fontSize: '14px',
          resize: 'vertical',
          boxSizing: 'border-box',
          marginBottom: '12px',
        }}
      />

      <button
        onClick={handleCheck}
        disabled={!inputText.trim() || checking}
        style={{
          padding: '10px 20px',
          borderRadius: '8px',
          border: 'none',
          background: 'linear-gradient(135deg, var(--primary), #8b5cf6)',
          color: 'white',
          cursor: inputText.trim() && !checking ? 'pointer' : 'not-allowed',
          opacity: inputText.trim() && !checking ? 1 : 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <CheckCircle size={16} />
        {checking ? 'チェック中...' : 'チェック'}
      </button>

      {/* 結果表示 */}
      {result && (
        <div
          style={{
            marginTop: '20px',
            padding: '16px',
            borderRadius: '12px',
            background: result.score >= 70
              ? 'rgba(34, 197, 94, 0.15)'
              : result.score >= 40
              ? 'rgba(245, 158, 11, 0.15)'
              : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${
              result.score >= 70
                ? 'rgba(34, 197, 94, 0.4)'
                : result.score >= 40
                ? 'rgba(245, 158, 11, 0.4)'
                : 'rgba(239, 68, 68, 0.4)'
            }`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            {result.score >= 70 ? (
              <CheckCircle size={24} color="#22c55e" />
            ) : (
              <AlertCircle size={24} color={result.score >= 40 ? '#f59e0b' : '#ef4444'} />
            )}
            <div>
              <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>一貫性スコア</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>{result.score}点</div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: 'white' }}>フィードバック:</div>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {result.feedback.map((item, index) => (
                <li key={index} style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
