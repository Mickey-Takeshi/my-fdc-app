/**
 * リーンキャンバス関連の型定義
 */

import type { useLeanCanvasViewModel, ProductType } from '@/lib/hooks/useLeanCanvasViewModel';
import type { Product, CustomerJourneyPhase } from '@/lib/types/app-data';

export type LeanCanvasViewModel = ReturnType<typeof useLeanCanvasViewModel>;

export type { ProductType, Product, CustomerJourneyPhase };
