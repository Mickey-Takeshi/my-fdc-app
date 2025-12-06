/**
 * app/_components/todo/elastic-habits-panel/constants.ts
 *
 * 定数定義
 */

// スート別の松竹梅カラー定義
export const LEVEL_COLORS_BY_SUIT = {
  heart: {
    // 🟥赤系グラデーション（#DC143C クリムゾン基準）
    ume:   { bg: '#FFF5F5', text: '#E57373' },
    take:  { bg: '#FFEBEE', text: '#DC143C' },
    matsu: { bg: '#FFCDD2', text: '#B22222' },
  },
  club: {
    // 青系グラデーション
    ume:   { bg: '#F5F9FF', text: '#64B5F6' },
    take:  { bg: '#E3F2FD', text: '#1976D2' },
    matsu: { bg: '#BBDEFB', text: '#0D47A1' },
  },
};
