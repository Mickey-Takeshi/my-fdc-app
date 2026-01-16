# Phase 25: UI改善 & 卒業のお祝い - Runbook

## 概要

Part 9の最終フェーズとして、コマンドベースアーキテクチャの恩恵を活かした
UI改善を実装し、基礎編を締めくくります。

## 実装内容

### 1. Optimistic UI（楽観的UI）
- コマンド実行時に即座にUIを更新
- API応答を待たずにユーザー体験を向上

### 2. Undo スナックバー
- 削除・アーカイブ操作後に「元に戻す」オプションを表示
- 5秒間の猶予期間

### 3. 同期ステータスインジケータ
- ヘッダーに保存状態を表示
- 保存中/完了/エラーを視覚的に表示

### 4. Dependabot設定
- GitHub Dependabotによる自動脆弱性監視
- 週次パッケージチェック

## 実装手順

### Step 1: Snackbar コンポーネント作成

```tsx
// app/_components/ui/Snackbar.tsx
'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface SnackbarProps {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  onClose: () => void;
}

export function Snackbar({ message, action, duration = 5000, onClose }: SnackbarProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#1f2937',
      color: 'white',
      padding: '12px 16px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 1000,
    }}>
      <span>{message}</span>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            background: 'none',
            border: 'none',
            color: '#60a5fa',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {action.label}
        </button>
      )}
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: '#9ca3af',
          cursor: 'pointer',
          padding: '4px',
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
```

### Step 2: SyncStatus インジケータ作成

```tsx
// app/_components/ui/SyncStatus.tsx
'use client';

import { Check, AlertCircle, Loader2 } from 'lucide-react';

type SyncState = 'idle' | 'saving' | 'saved' | 'error';

interface SyncStatusProps {
  state: SyncState;
  errorMessage?: string;
}

export function SyncStatus({ state, errorMessage }: SyncStatusProps) {
  const getContent = () => {
    switch (state) {
      case 'saving':
        return (
          <>
            <Loader2 size={14} className="spin" />
            <span>保存中...</span>
          </>
        );
      case 'saved':
        return (
          <>
            <Check size={14} />
            <span>保存済み</span>
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle size={14} />
            <span title={errorMessage}>エラー</span>
          </>
        );
      default:
        return null;
    }
  };

  if (state === 'idle') return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '12px',
      padding: '4px 8px',
      borderRadius: '4px',
      background: state === 'error' ? '#fef2f2' : state === 'saving' ? '#f3f4f6' : '#f0fdf4',
      color: state === 'error' ? '#dc2626' : state === 'saving' ? '#6b7280' : '#16a34a',
    }}>
      {getContent()}
    </div>
  );
}
```

### Step 3: SnackbarProvider コンテキスト作成

```tsx
// lib/contexts/SnackbarContext.tsx
'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Snackbar } from '@/app/_components/ui/Snackbar';

interface SnackbarOptions {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

interface SnackbarContextType {
  showSnackbar: (options: SnackbarOptions) => void;
}

const SnackbarContext = createContext<SnackbarContextType | null>(null);

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [snackbar, setSnackbar] = useState<SnackbarOptions | null>(null);

  const showSnackbar = useCallback((options: SnackbarOptions) => {
    setSnackbar(options);
  }, []);

  const handleClose = useCallback(() => {
    setSnackbar(null);
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      {snackbar && (
        <Snackbar
          message={snackbar.message}
          action={snackbar.action}
          duration={snackbar.duration}
          onClose={handleClose}
        />
      )}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
}
```

### Step 4: Dependabot設定

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 10
    labels:
      - "dependencies"
      - "automated"
    commit-message:
      prefix: "chore(deps)"
    groups:
      minor-and-patch:
        patterns:
          - "*"
        update-types:
          - "minor"
          - "patch"
```

### Step 5: レイアウトにProvider追加

app/(app)/layout.tsxにSnackbarProviderを追加

### Step 6: 完了メッセージ

基礎編完了のお祝いメッセージを表示

## 検証

1. `npm run type-check` - 型チェック
2. `npm run build` - ビルド成功確認
3. Snackbarコンポーネントの動作確認
4. SyncStatusの表示確認

## 成果物

- `app/_components/ui/Snackbar.tsx` - Snackbarコンポーネント
- `app/_components/ui/SyncStatus.tsx` - 同期ステータス
- `lib/contexts/SnackbarContext.tsx` - Snackbarコンテキスト
- `.github/dependabot.yml` - Dependabot設定
