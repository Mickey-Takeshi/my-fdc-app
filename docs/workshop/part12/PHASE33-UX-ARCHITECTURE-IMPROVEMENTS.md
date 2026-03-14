# Part 12 Phase 33: UX & アーキテクチャ改善

> 「クエリはチューニングした。インデックスも貼った。それでもなんか UX が重いし、設計に不安がある。」
>
> 原因はシンプルで、**クエリ最適化 = UX 向上の 1 ピースでしかない** からです。

---

## 学習目標

このフェーズを完了すると、以下ができるようになります：

1. **体感速度の向上** - Optimistic UI パターンを実装できる
2. **API設計の改善** - ユースケース単位APIと柔軟なデータ取得を設計できる
3. **キャッシュ戦略** - React Query の効果的な設定ができる
4. **エラーハンドリング** - ユーザーに優しいエラー処理を実装できる
5. **設計品質の評価** - 9つの観点でアーキテクチャをレビューできる

---

## 前提知識

- Phase 30-32（3層アーキテクチャ: OKR/ActionMap/Task）を完了していること
- React Query（TanStack Query）の基本的な使い方
- Next.js App Router の Route Handlers

---

## 33.1 設計レビューの全体像：9つの観点

設計レビューで最低限押さえておきたいのは、この9項目です。

| # | 観点 | 主なチェックポイント |
|---|------|---------------------|
| 1 | データモデル・ドメイン設計 | 構造が一言で説明できるか？二重管理はないか？ |
| 2 | API設計（境界と契約） | 1エンドポイント1責務か？レスポンス粒度は適切か？ |
| 3 | キャッシュ・読み取りパターン | どこでキャッシュするか決まっているか？ |
| 4 | 書き込みパターン・整合性・排他 | トランザクション境界は？同時更新の扱いは？ |
| 5 | エラー処理・フォールバック | ユーザーは次に何をすればいいか分かるか？ |
| 6 | マルチテナント・セキュリティ | テナント境界は守られているか？ |
| 7 | 拡張性・変更容易性 | 半年後の機能追加に耐えられるか？ |
| 8 | 観測性（ログ・メトリクス） | 問題発生時に何を見れば分かるか？ |
| 9 | レビュー用チェックリスト | 12項目の最終確認 |

---

## 33.2 体感速度を上げる

### 33.2.1 なぜ体感速度が重要か

```
【実際の速度】≠【体感速度】

実際: API 300ms + レンダリング 100ms = 400ms
体感: ローディング表示なし → 「固まった？」→ 不安

実際: API 500ms
体感: 即座にUI更新 → 裏でAPI → 「サクサク！」
```

**ポイント**: ユーザーが「待っている」と感じる時間を最小化する

### 33.2.2 Optimistic UI パターン

**概念**: APIの結果を待たずに、先にUIを更新する

```typescript
// 従来のパターン（悲観的UI）
const handleComplete = async (taskId: string) => {
  setLoading(true);
  await api.completeTask(taskId);  // 300ms待つ
  await refetch();                  // さらに300ms待つ
  setLoading(false);
  // ユーザーは600ms待たされる
};

// Optimistic UI パターン
const handleComplete = async (taskId: string) => {
  // 1. 即座にUIを更新（0ms）
  setTasks(prev => prev.map(t =>
    t.id === taskId ? { ...t, status: 'done' } : t
  ));

  try {
    // 2. 裏でAPIを呼ぶ
    await api.completeTask(taskId);
  } catch (error) {
    // 3. 失敗したら元に戻す
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: 'not_started' } : t
    ));
    toast.error('完了に失敗しました');
  }
};
```

### 33.2.3 React Query での Optimistic UI

```typescript
// lib/hooks/task/useTaskMutations.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) =>
      fetch(`/api/tasks/${taskId}/complete`, { method: 'POST' }),

    // 楽観的更新
    onMutate: async (taskId) => {
      // 1. 進行中のクエリをキャンセル（競合防止）
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      // 2. 現在の値をバックアップ
      const previousTasks = queryClient.getQueryData(['tasks']);

      // 3. キャッシュを即座に更新
      queryClient.setQueryData(['tasks'], (old: Task[]) =>
        old.map(t => t.id === taskId
          ? { ...t, status: 'done', completedAt: new Date().toISOString() }
          : t
        )
      );

      // 4. バックアップを返す（ロールバック用）
      return { previousTasks };
    },

    // エラー時：ロールバック
    onError: (err, taskId, context) => {
      queryClient.setQueryData(['tasks'], context?.previousTasks);
      toast.error('タスク完了に失敗しました');
    },

    // 成功/失敗に関わらず：最新データで更新
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
```

### 33.2.4 ハンズオン: タスク削除の Optimistic UI

**課題**: 上記のコードを参考に、タスクの「削除」にも Optimistic UI を適用してください。

```typescript
// 完成させてください
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => /* TODO */,
    onMutate: async (taskId) => {
      // TODO: 楽観的更新を実装
      // ヒント: filter で該当タスクを除外
    },
    onError: (err, taskId, context) => {
      // TODO: ロールバックを実装
    },
    onSettled: () => {
      // TODO: 最新データで更新
    },
  });
}
```

---

## 33.3 API 設計（境界と契約）

### 33.3.1 1 エンドポイント 1 責務

やりがちなのが「なんでも屋 API」です。

```typescript
// 悪い例：
POST /tasks/complex  // 取得・集計・作成・更新を全部やる

// 良い例：
GET  /tasks          // 一覧取得
POST /tasks          // 作成
GET  /me/today       // ユースケース単位のサマリ API
```

**リソース単位の API** と **ユースケース単位の API** を、意図的に分けるだけでも設計はかなり整理されます。

### 33.3.2 リソース単位 vs ユースケース単位

```
【リソース単位API】（CRUD）
GET  /api/tasks           → タスク一覧
GET  /api/objectives      → OKR一覧
GET  /api/habits          → 習慣一覧

【ユースケース単位API】
GET  /api/me/today        → 今日必要な情報をまとめて取得
GET  /api/me/dashboard    → ダッシュボードに必要な情報
GET  /api/me/weekly-review → 週次レビュー用データ
```

**使い分け**:
- **リソース単位**: 汎用的なCRUD操作
- **ユースケース単位**: 特定画面に最適化されたデータ取得

### 33.3.3 /api/me/today の設計

**目的**: ダッシュボードのファーストビューを1APIで構成

```typescript
// app/api/me/today/route.ts

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId, workspaceId } = session;
  const today = new Date().toISOString().split('T')[0];

  // 並列でデータ取得（パフォーマンス向上）
  const [tasksResult, okrsResult, habitsResult] = await Promise.all([
    // 今日のタスク
    supabase
      .from('tasks')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('scheduled_date', today)
      .is('trashed_at', null)
      .order('position')
      .order('sort_order'),

    // 今期のOKR（上位3件）
    supabase
      .from('okr_objectives')
      .select(`
        *,
        key_results:okr_key_results(*)
      `)
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')
      .order('progress_rate', { ascending: false })
      .limit(3),

    // 今日の習慣
    supabase
      .from('habit_masters')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('is_archived', false),
  ]);

  // レスポンス構築
  const tasks = tasksResult.data || [];
  return NextResponse.json({
    todayTasks: {
      spade: tasks.filter(t => t.position === 'spade'),
      heart: tasks.filter(t => t.position === 'heart'),
      other: tasks.filter(t => !['spade', 'heart'].includes(t.position)),
    },
    topOKRs: okrsResult.data || [],
    todayHabits: habitsResult.data || [],
    summary: {
      completedToday: tasks.filter(t => t.status === 'done').length,
      remainingToday: tasks.filter(t => t.status !== 'done').length,
    },
  });
}
```

### 33.3.4 レスポンスの粒度（過不足）

**問題**:
- **オーバーフェッチ**: 画面で使わない情報まで全部返してしまう
- **アンダーフェッチ**: 画面表示に必要な情報を得るために3〜4回APIを叩く

**解決策**: `?include` オプションで制御

```typescript
// GET /api/objectives
// GET /api/objectives?include=keyResults
// GET /api/objectives?include=keyResults,actionMaps

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const include = searchParams.get('include')?.split(',') || [];

  // ベースクエリ
  let selectQuery = '*';

  // include に応じて JOIN を追加
  if (include.includes('keyResults')) {
    selectQuery = '*, key_results:okr_key_results(*)';
  }

  if (include.includes('actionMaps')) {
    selectQuery = `
      *,
      key_results:okr_key_results(
        *,
        action_map_links:kr_action_map_links(
          action_map:action_maps(id, title, progress)
        )
      )
    `;
  }

  const { data, error } = await supabase
    .from('okr_objectives')
    .select(selectQuery)
    .eq('workspace_id', workspaceId);

  return NextResponse.json(data);
}
```

---

## 33.4 キャッシュ・読み取りパターン

### 33.4.1 どこでキャッシュするかを決める

- **フロント側**（React Query など）でキャッシュする前提になっているか？
- **サーバー側**でキャッシュ or マテリアライズしたほうが良い重い集計はどれか？

「全部 DB に毎回取りに行く」前提だと、どこかで限界が来ます。

### 33.4.2 React Query のキャッシュ設定

```typescript
// lib/query-client.ts

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // データが「古い」とみなされるまでの時間
      staleTime: 30 * 1000,  // 30秒

      // キャッシュを保持する時間
      cacheTime: 5 * 60 * 1000,  // 5分

      // ウィンドウフォーカス時に再取得しない
      refetchOnWindowFocus: false,

      // リトライ設定
      retry: 3,
      retryDelay: (attemptIndex) =>
        Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
```

### 33.4.3 データ種別ごとのキャッシュ設定

```typescript
// 頻繁に更新されるデータ（タスク）
const { data: tasks } = useQuery({
  queryKey: ['tasks'],
  queryFn: fetchTasks,
  staleTime: 10 * 1000,  // 10秒で古くなる
});

// あまり更新されないデータ（習慣マスタ）
const { data: habitMasters } = useQuery({
  queryKey: ['habitMasters'],
  queryFn: fetchHabitMasters,
  staleTime: 5 * 60 * 1000,  // 5分で古くなる
  cacheTime: 30 * 60 * 1000, // 30分キャッシュ保持
});

// ほぼ変わらないデータ（ワークスペース設定）
const { data: workspaceSettings } = useQuery({
  queryKey: ['workspaceSettings'],
  queryFn: fetchWorkspaceSettings,
  staleTime: Infinity,  // 明示的に無効化するまで有効
});
```

### 33.4.4 フェッチ戦略は統一されているか？

Next.js なら、ルールを決めておくと楽です：

| データ種別 | フェッチ場所 | 理由 |
|-----------|------------|------|
| 一覧・サマリ | Server Components / Route Handler | 初期表示を速く |
| ユーザー操作直結 | Client Components + useQuery | リアルタイム更新 |
| マスタデータ | Server Components | SSR でキャッシュ |

### 33.4.5 ページング・無限スクロール

- ログや履歴、タスクなど「増え続けるデータ」は必ずページング前提
- **「全件取得」は原則禁止**

```typescript
// 悪い例：全件取得
const { data } = await supabase.from('task_logs').select('*');

// 良い例：ページング
const { data } = await supabase
  .from('task_logs')
  .select('*')
  .order('created_at', { ascending: false })
  .range(0, 49);  // 50件ずつ
```

---

## 33.5 書き込みパターン・整合性・排他

### 33.5.1 トランザクション境界は意識されているか？

例：タスク完了 → 実績時間の記録 → OKR の進捗再計算

これをバラバラのクエリで実行していると、途中失敗で矛盾状態になります。

```typescript
// ProgressService で一括処理
async function onTaskCompleted(taskId: string) {
  // 1つのトランザクション的な流れで処理
  await updateTaskStatus(taskId, 'done');
  await recordTaskLog(taskId);
  await propagateProgressToActionItem(taskId);
  await propagateProgressToActionMap(actionItemId);
  await propagateProgressToKR(actionMapId);
  await propagateProgressToObjective(krId);
}
```

### 33.5.2 同時更新の扱い（レースコンディション）

同じタスクを 2 人が同時編集したらどうなるか？

**設計の選択肢**:

| 方式 | 説明 | 採用ケース |
|------|------|----------|
| 最後の書き込み勝ち | 後から保存した方が上書き | シンプルな更新 |
| 楽観ロック | version番号で競合検知 | **FDCで採用** |
| 強制ロック | 編集中は他ユーザー編集不可 | 重要ドキュメント |

**楽観ロックの実装**:

```typescript
// DBトリガー
CREATE TRIGGER trg_tasks_version
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  WHEN (NEW.version != OLD.version)
  EXECUTE FUNCTION check_version_and_increment();

// API側
const { error } = await supabase
  .from('tasks')
  .update({ title: newTitle, version: currentVersion + 1 })
  .eq('id', taskId)
  .eq('version', currentVersion);  // 現在のバージョンと一致する場合のみ更新

if (error?.code === '40001') {
  // 競合発生
  throw new ConflictError('他のユーザーが更新中です');
}
```

### 33.5.3 冪等性（いべとうせい）

同じリクエストが 2 回送られても結果が壊れないか？

```typescript
// 悪い例：2回叩くと2回完了扱いになる
const completeTask = async (taskId: string) => {
  await supabase.from('tasks').update({ status: 'done' });
  await supabase.from('task_logs').insert({ task_id: taskId }); // 2回INSERTされる！
};

// 良い例：すでに完了なら何もしない
const completeTask = async (taskId: string) => {
  const { data: task } = await supabase
    .from('tasks')
    .select('status')
    .eq('id', taskId)
    .single();

  if (task?.status === 'done') {
    return { success: true, message: 'Already completed' };
  }

  // 完了処理...
};
```

---

## 33.6 エラー処理・フォールバック

### 33.6.1 ユーザーは次に何をすればいいか分かるか？

```typescript
// 悪い例
toast.error('保存に失敗しました（コード: 500）');

// 良い例
switch (error.code) {
  case 'NETWORK_ERROR':
    toast.error('接続が不安定です', {
      action: { label: '再試行', onClick: retry }
    });
    break;
  case 'UNAUTHORIZED':
    toast.error('セッションが切れました', {
      action: { label: 'ログイン', onClick: () => router.push('/login') }
    });
    break;
  case 'VERSION_CONFLICT':
    toast.error('他のユーザーが更新しました', {
      action: { label: '更新する', onClick: () => location.reload() }
    });
    break;
}
```

### 33.6.2 入力内容は消えないか？

長文フォームで送信エラーが出た時、入力内容は保持されるか？

```typescript
// オートセーブ実装
const [draft, setDraft] = useState('');

// ローカルストレージに一時保存
useEffect(() => {
  const saved = localStorage.getItem('task_draft');
  if (saved) setDraft(saved);
}, []);

useEffect(() => {
  localStorage.setItem('task_draft', draft);
}, [draft]);

// 送信成功時にクリア
const onSuccess = () => {
  localStorage.removeItem('task_draft');
};
```

### 33.6.3 外部 API 障害時の振る舞い

Google カレンダーなど外部サービスが落ちたとき：

```typescript
// lib/hooks/task/calendar/auth-state.ts

// 5分間リトライを停止（無限ループ防止）
export function hasCalendarAuthError(): boolean {
  const { hasError, timestamp } = getStoredAuthError();
  if (!hasError) return false;

  // 5分経過していたらリセット
  if (timestamp && Date.now() - timestamp > 5 * 60 * 1000) {
    clearStoredAuthError();
    return false;
  }

  return true;
}
```

---

## 33.7 マルチテナント・セキュリティ設計

### 33.7.1 テナント境界チェック

すべての API 入口で、セッションの `workspace_id` とリクエスト対象を突き合わせる：

```typescript
// lib/api/validateWorkspaceAccess.ts

export async function validateWorkspaceAccess(
  userId: number,
  workspaceId: number
): Promise<void> {
  const { data: membership } = await supabase
    .from('workspace_memberships')
    .select('role')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .single();

  if (!membership) {
    throw new ForbiddenError('このワークスペースへのアクセス権限がありません');
  }
}
```

### 33.7.2 権限モデル

「誰が」「どのワークスペースの」「どのリソース」に対して、何ができるか：

| ロール | 読み取り | 書き込み | 削除 | メンバー管理 |
|--------|---------|---------|------|-------------|
| owner | all | all | all | all |
| admin | all | all | all | members only |
| member | all | own | own | - |
| guest | limited | - | - | - |

---

## 33.8 保存・同期ステータス表示

### 33.8.1 SyncStatusIndicator コンポーネント

```typescript
// app/_components/common/SyncStatusIndicator.tsx

'use client';

import { useIsMutating } from '@tanstack/react-query';
import { Cloud, CloudOff, Loader2, Check } from 'lucide-react';

export function SyncStatusIndicator() {
  const isMutating = useIsMutating();
  const isOnline = useOnlineStatus();

  const status = !isOnline
    ? 'offline'
    : isMutating > 0
    ? 'syncing'
    : 'synced';

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      {status === 'syncing' && (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>同期中...</span>
        </>
      )}
      {status === 'synced' && (
        <>
          <Check className="h-4 w-4 text-green-500" />
          <span>保存済み</span>
        </>
      )}
      {status === 'offline' && (
        <>
          <CloudOff className="h-4 w-4 text-yellow-500" />
          <span>オフライン</span>
        </>
      )}
    </div>
  );
}
```

---

## 33.9 キーボードショートカット

### 33.9.1 コマンドパレット（Cmd+K）

```typescript
// app/_components/common/CommandPalette.tsx

'use client';

import { useEffect, useState } from 'react';
import { Command } from 'cmdk';

export function CommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Command.Dialog open={open} onOpenChange={setOpen}>
      <Command.Input placeholder="コマンドを入力..." />
      <Command.List>
        <Command.Group heading="タスク">
          <Command.Item>新規タスク作成</Command.Item>
          <Command.Item>今日のタスクを表示</Command.Item>
        </Command.Group>
        <Command.Group heading="OKR">
          <Command.Item>OKR一覧を開く</Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
```

---

## 33.10 観測性（ログ・メトリクス）

### 33.10.1 構造化ログ

```typescript
// lib/logger.ts

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  requestId: string;
  userId?: number;
  workspaceId?: number;
  action: string;
  resourceType: string;
  resourceId?: string;
  durationMs?: number;
  error?: { code: string; message: string };
}

export function log(entry: Omit<LogEntry, 'timestamp'>) {
  console.log(JSON.stringify({
    ...entry,
    timestamp: new Date().toISOString(),
  }));
}

// 使用例
log({
  level: 'info',
  requestId: crypto.randomUUID(),
  userId: session.userId,
  workspaceId: session.workspaceId,
  action: 'task.complete',
  resourceType: 'task',
  resourceId: taskId,
  durationMs: Date.now() - startTime,
});
```

---

## 33.11 設計レビュー「最後の一枚」チェックリスト

設計レビュー前に、**最低限これだけは YES にしたい項目**：

| # | チェック項目 | YES/NO |
|---|-------------|--------|
| 1 | この機能のデータ構造を「図なしで」一言で説明できる | |
| 2 | すべての業務データに `workspace_id` が付いている | |
| 3 | API は「1エンドポイント1責務」になっている | |
| 4 | 画面専用の読み取りAPIと汎用APIの役割が整理されている | |
| 5 | 読み取りのキャッシュ戦略（どこでキャッシュするか）が決まっている | |
| 6 | 複数テーブルを跨ぐ更新処理に、トランザクション設計がある | |
| 7 | 同時更新（レースコンディション）時の振る舞いが説明できる | |
| 8 | 主要な書き込みパスは「冪等になる」ように設計されている | |
| 9 | エラー時にユーザーが「次に何をすればいいか」分かるUIになっている | |
| 10 | テナント境界・権限のルールをA4 1枚で説明できる | |
| 11 | 「半年後にありそうな機能追加」に対して、スキーマとAPIが硬くない | |
| 12 | 運用開始後に見るメトリクス・ログが決まっている | |

---

## 33.12 Phase 33 完了チェックリスト

### 実装完了条件

- [ ] タスク完了に Optimistic UI が実装されている
- [ ] `/api/me/today` APIが実装され、ダッシュボードで使用されている
- [ ] React Query のキャッシュ設定が統一されている
- [ ] エラー時にユーザーに適切なメッセージが表示される
- [ ] 保存・同期ステータスがヘッダーに表示されている
- [ ] `Cmd+K` でコマンドパレットが開く
- [ ] APIログがJSON形式で出力されている
- [ ] 12項目のチェックリストがすべてYESになっている

### 自己チェック質問

1. ユーザーがタスクを完了したとき、何ms以内にUIが更新されるか？
2. ネットワークエラーが発生したとき、ユーザーは何をすればいいか分かるか？
3. 「保存されたかどうか」をユーザーはどこで確認できるか？
4. 問題が発生したとき、ログから原因を特定できるか？
5. 「クエリ最適化以外で」UXを改善した点を3つ挙げられるか？

---

## まとめ

クエリ最適化はもちろん大事ですが、それだけでは UX は良くなりません。

- **データモデル** - 構造が一言で説明できるか
- **API の責務** - 1エンドポイント1責務になっているか
- **キャッシュ・書き込みパターン** - 整合性と速度のバランス
- **エラーとセキュリティ** - ユーザーの不安を消す
- **拡張性と観測性** - 半年後も安心

これらの「設計の地盤」を固めることで、

> 「なんか遅い・怖い・分かりづらい」を
> 「安心して触れる・成長に耐えられる SaaS」

に変えていくことができます。

---

## 参考資料

- [React Query ドキュメント](https://tanstack.com/query/latest)
- [cmdk - コマンドパレットライブラリ](https://cmdk.paco.me/)
- [Vercel Logging](https://vercel.com/docs/observability/runtime-logs)

---

**次のフェーズ**: Phase 34 - パフォーマンス最適化（バンドルサイズ、画像最適化）
