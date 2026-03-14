# ローカライズ設計

## 1. ローカライズの概要

### 1.1 対応ロケール
| ロケール | 言語 | 地域 | 通貨 | 日付形式 |
|---------|------|------|------|---------|
| ja-JP | 日本語 | 日本 | JPY | YYYY/MM/DD |
| en-US | 英語 | 米国 | USD | MM/DD/YYYY |
| en-GB | 英語 | 英国 | GBP | DD/MM/YYYY |

### 1.2 フォーマット対象
| カテゴリ | 対象 | 使用API |
|---------|------|--------|
| 日付・時刻 | 日付表示、相対時間 | Intl.DateTimeFormat |
| 通貨 | 価格、金額 | Intl.NumberFormat |
| 数値 | 統計、パーセント | Intl.NumberFormat |
| 単位 | 距離、容量 | Intl.NumberFormat |

## 2. 日付・時刻フォーマット

### 2.1 日付フォーマットパターン
| パターン | ja-JP | en-US | en-GB |
|---------|-------|-------|-------|
| 短い | 2025/01/15 | 1/15/2025 | 15/01/2025 |
| 中間 | 2025年1月15日 | Jan 15, 2025 | 15 Jan 2025 |
| 長い | 2025年1月15日水曜日 | Wednesday, January 15, 2025 | Wednesday, 15 January 2025 |

### 2.2 時刻フォーマットパターン
| パターン | ja-JP | en-US | en-GB |
|---------|-------|-------|-------|
| 短い | 14:30 | 2:30 PM | 14:30 |
| 長い | 14:30:00 | 2:30:00 PM | 14:30:00 |
| タイムゾーン付き | 14:30 JST | 2:30 PM EST | 14:30 GMT |

### 2.3 相対時間
| 差分 | ja | en |
|------|-----|-----|
| -1日 | 昨日 | yesterday |
| -2時間 | 2時間前 | 2 hours ago |
| +1日 | 明日 | tomorrow |
| +1週間 | 1週間後 | in 1 week |

### 2.4 フォーマット関数

```typescript
// lib/i18n/date.ts
export function formatDate(
  date: Date,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  }).format(date);
}

// 使用例
formatDate(new Date(), 'ja-JP'); // "2025年1月15日"
formatDate(new Date(), 'en-US'); // "January 15, 2025"
```

### 2.5 相対時間関数

```typescript
// lib/i18n/relative-time.ts
export function formatRelativeTime(
  date: Date,
  locale: string
): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const diff = date.getTime() - Date.now();
  const diffDays = Math.round(diff / (1000 * 60 * 60 * 24));

  if (Math.abs(diffDays) < 1) {
    const diffHours = Math.round(diff / (1000 * 60 * 60));
    return rtf.format(diffHours, 'hour');
  }
  return rtf.format(diffDays, 'day');
}
```

### 2.6 タイムゾーン対応
| 項目 | 設定 |
|------|------|
| 検出 | Intl.DateTimeFormat().resolvedOptions().timeZone |
| 保存 | UTC |
| 表示 | ユーザーのタイムゾーン |

```typescript
// lib/i18n/timezone.ts
export function formatWithTimezone(
  date: Date,
  locale: string,
  timezone: string
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date);
}

// 使用例
formatWithTimezone(new Date(), 'ja-JP', 'Asia/Tokyo');
// "2025年1月15日 14:30 JST"
```

## 3. 通貨フォーマット

### 3.1 通貨フォーマットパターン
| 金額 | ja-JP (JPY) | en-US (USD) | de-DE (EUR) |
|------|-------------|-------------|-------------|
| 1234.56 | ¥1,235 | $1,234.56 | 1.234,56 EUR |
| -1234.56 | -¥1,235 | -$1,234.56 | -1.234,56 EUR |

### 3.2 通貨設定
| 通貨 | コード | 小数点 | 記号位置 |
|------|--------|--------|---------|
| 日本円 | JPY | 0 | 前 |
| 米ドル | USD | 2 | 前 |
| ユーロ | EUR | 2 | 後（ドイツ） |
| ポンド | GBP | 2 | 前 |

### 3.3 通貨フォーマット関数

```typescript
// lib/i18n/currency.ts
export function formatCurrency(
  amount: number,
  currency: string,
  locale: string
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

// 使用例
formatCurrency(1234.56, 'JPY', 'ja-JP'); // "¥1,235"
formatCurrency(1234.56, 'USD', 'en-US'); // "$1,234.56"
```

### 3.4 価格表示コンポーネント

```typescript
// components/Price.tsx
'use client';
import { useLocale } from 'next-intl';

interface PriceProps {
  amount: number;
  currency?: string;
}

export function Price({ amount, currency = 'JPY' }: PriceProps) {
  const locale = useLocale();

  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'JPY' ? 0 : 2,
  }).format(amount);

  return <span className="price">{formatted}</span>;
}
```

### 3.5 通貨表示ルール
| ルール | 説明 |
|--------|------|
| 主通貨 | ユーザー設定に従う |
| 為替表示 | 元通貨と換算額を併記 |
| 価格帯 | 桁区切りを使用 |

## 4. 数値フォーマット

### 4.1 数値フォーマットパターン
| 数値 | ja-JP | en-US | de-DE |
|------|-------|-------|-------|
| 1234567 | 1,234,567 | 1,234,567 | 1.234.567 |
| 0.1234 | 0.1234 | 0.1234 | 0,1234 |

### 4.2 数値フォーマット関数

```typescript
// lib/i18n/number.ts
export function formatNumber(
  value: number,
  locale: string,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

// 使用例
formatNumber(1234567, 'ja-JP');  // "1,234,567"
formatNumber(1234567, 'de-DE');  // "1.234.567"
```

### 4.3 パーセント表示

```typescript
export function formatPercent(
  value: number,
  locale: string
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 1,
  }).format(value);
}

// 使用例
formatPercent(0.1234, 'ja-JP'); // "12.3%"
```

### 4.4 単位表示

```typescript
export function formatUnit(
  value: number,
  unit: string,
  locale: string
): string {
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit,
    unitDisplay: 'short',
  }).format(value);
}

// 使用例
formatUnit(100, 'kilometer', 'ja-JP'); // "100 km"
formatUnit(100, 'mile', 'en-US');      // "100 mi"
```

## 5. 統合フォーマッター

### 5.1 フォーマッター関数一覧
| 関数 | 用途 | 戻り値 |
|------|------|--------|
| formatDate | 日付フォーマット | string |
| formatTime | 時刻フォーマット | string |
| formatRelativeTime | 相対時間 | string |
| formatCurrency | 通貨フォーマット | string |
| formatNumber | 数値フォーマット | string |
| formatPercent | パーセント | string |

### 5.2 useFormatterフック

```typescript
// hooks/useFormatter.ts
'use client';
import { useLocale } from 'next-intl';

export function useFormatter() {
  const locale = useLocale();

  return {
    date: (date: Date, options?: Intl.DateTimeFormatOptions) =>
      formatDate(date, locale, options),

    relativeTime: (date: Date) =>
      formatRelativeTime(date, locale),

    currency: (amount: number, currency = 'JPY') =>
      formatCurrency(amount, currency, locale),

    number: (value: number, options?: Intl.NumberFormatOptions) =>
      formatNumber(value, locale, options),

    percent: (value: number) =>
      formatPercent(value, locale),
  };
}
```

### 5.3 使用例

```typescript
function StatsCard() {
  const fmt = useFormatter();

  return (
    <div>
      <p>売上: {fmt.currency(1234567)}</p>
      <p>成長率: {fmt.percent(0.15)}</p>
      <p>更新: {fmt.relativeTime(lastUpdated)}</p>
    </div>
  );
}
```

## 6. RTL（右から左）対応

### 6.1 RTL言語
| 言語 | ロケール | 方向 |
|------|---------|------|
| アラビア語 | ar | RTL |
| ヘブライ語 | he | RTL |
| ペルシア語 | fa | RTL |
| ウルドゥー語 | ur | RTL |

### 6.2 RTL対応方針
| 項目 | 対応 |
|------|------|
| dir属性 | `<html dir="rtl">` |
| CSSプロパティ | 論理プロパティを使用 |
| アイコン | 必要に応じて反転 |
| レイアウト | Flexbox/Gridで自動対応 |

### 6.3 方向の検出

```typescript
// lib/i18n/direction.ts
const RTL_LOCALES = ['ar', 'he', 'fa', 'ur'];

export function isRTL(locale: string): boolean {
  return RTL_LOCALES.includes(locale.split('-')[0]);
}
```

### 6.4 論理プロパティ対応表
| 物理プロパティ | 論理プロパティ |
|--------------|--------------|
| margin-left | margin-inline-start |
| margin-right | margin-inline-end |
| padding-left | padding-inline-start |
| padding-right | padding-inline-end |
| text-align: left | text-align: start |
| text-align: right | text-align: end |

## 7. 文化的考慮事項

### 7.1 考慮すべき項目
| 項目 | 例 |
|------|-----|
| 色の意味 | 赤=エラー（グローバル）、緑=お金（中国） |
| 画像・アイコン | 手のジェスチャー、宗教的シンボル |
| 名前の表示 | 姓名の順序（日本: 姓名、英語: 名姓） |
| 敬称 | 様、Mr./Ms. |

### 7.2 対応方針
| 項目 | 方針 |
|------|------|
| 色 | 意味が明確なアイコンを併用 |
| 画像 | ニュートラルなデザイン |
| 名前 | ロケールに応じた表示順 |
| 敬称 | ロケールに応じた敬称パターン |

### 7.3 名前表示関数

```typescript
// lib/i18n/name.ts
export function formatName(
  firstName: string,
  lastName: string,
  locale: string
): string {
  // 日本語: 姓 名
  if (locale.startsWith('ja')) {
    return `${lastName} ${firstName}`;
  }
  // 英語: 名 姓
  return `${firstName} ${lastName}`;
}
```

## 8. 実装チェックリスト

- [x] 日付フォーマット関数の設計
- [x] 通貨フォーマット関数の設計
- [x] 数値フォーマット関数の設計
- [x] useFormatterフックの設計
- [x] RTL対応方針の策定
- [x] 文化的考慮事項の確認
