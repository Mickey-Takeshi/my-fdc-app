/**
 * app/_components/todo/task-board-tab/CelebrationOverlay.tsx
 *
 * 紙吹雪アニメーションコンポーネント
 */

'use client';

import React, { useState, useEffect } from 'react';
import { PartyPopper } from 'lucide-react';
import type { CelebrationOverlayProps, ConfettiPiece } from './types';

export function CelebrationOverlay({ show, onComplete }: CelebrationOverlayProps) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (show) {
      // 紙吹雪を生成
      const colors = ['#DC143C', '#1976D2', '#FFC107', '#4CAF50', '#9C27B0', '#FF9800'];
      const pieces: ConfettiPiece[] = [];
      for (let i = 0; i < 50; i++) {
        pieces.push({
          id: i,
          x: Math.random() * 100,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: Math.random() * 0.5,
          duration: 2 + Math.random() * 2,
          size: 8 + Math.random() * 8,
        });
      }
      // 非同期でsetStateを呼び出す（ESLint react-hooks/set-state-in-effect対策）
      queueMicrotask(() => setConfetti(pieces));

      // 4秒後に非表示
      const timer = setTimeout(() => {
        onComplete();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 100,
        overflow: 'hidden',
      }}
    >
      {/* 紙吹雪 */}
      {confetti.map((piece) => (
        <div
          key={piece.id}
          style={{
            position: 'absolute',
            left: `${piece.x}%`,
            top: '-20px',
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            background: piece.color,
            borderRadius: '2px',
            animation: `confetti-fall ${piece.duration}s ease-out ${piece.delay}s forwards`,
            transform: 'rotate(0deg)',
          }}
        />
      ))}

      {/* 祝福メッセージ */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          animation: 'celebration-bounce 0.6s ease-out',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '24px 48px',
            borderRadius: '20px',
            boxShadow: '0 10px 40px rgba(102, 126, 234, 0.4)',
          }}
        >
          <PartyPopper size={48} style={{ marginBottom: '12px' }} />
          <h2 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: 700 }}>
            おめでとう！
          </h2>
          <p style={{ margin: 0, fontSize: '16px', opacity: 0.9 }}>
            今日のタスクをすべて完了しました！
          </p>
        </div>
      </div>

      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        @keyframes celebration-bounce {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
