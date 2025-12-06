/**
 * 商品アイコンマッピング
 */

import { Flame, Star, Gift } from 'lucide-react';

export const PRODUCT_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string; style?: React.CSSProperties }>> = {
  fire: Flame,
  star: Star,
  gift: Gift,
};
