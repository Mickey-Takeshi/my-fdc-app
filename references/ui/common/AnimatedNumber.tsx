/**
 * app/_components/common/AnimatedNumber.tsx
 *
 * 数値のカウントアップアニメーションコンポーネント
 */

'use client';

import { useState, useEffect, useRef } from 'react';

interface AnimatedNumberProps {
  value: number | string;
  duration?: number; // アニメーション時間（ミリ秒）
  suffix?: string; // 接尾辞（例: "%"）
  decimals?: number; // 小数点以下の桁数
}

export function AnimatedNumber({
  value,
  duration = 800,
  suffix = '',
  decimals = 0,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);

  // 文字列の場合は数値部分を抽出
  const numericValue = typeof value === 'string'
    ? parseFloat(value.replace(/[^0-9.-]/g, '')) || 0
    : value;

  // suffixを自動検出（%など）
  const detectedSuffix = suffix || (typeof value === 'string' && value.includes('%') ? '%' : '');

  useEffect(() => {
    // 初期値が0の場合はアニメーションスキップ
    if (numericValue === 0) {
      return;
    }

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // イージング関数（easeOutCubic）
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = numericValue * easeOut;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    // リセットして新しいアニメーションを開始
    startTimeRef.current = null;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [numericValue, duration]);

  // 表示用にフォーマット
  const formattedValue = decimals > 0
    ? displayValue.toFixed(decimals)
    : Math.round(displayValue).toLocaleString();

  return (
    <span>
      {formattedValue}{detectedSuffix}
    </span>
  );
}

export default AnimatedNumber;
