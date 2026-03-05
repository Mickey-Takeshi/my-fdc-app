# プッシュ通知・オフライン対応設計書

## 1. プッシュ通知アーキテクチャ

### 1.1 通知フロー

```
Server (Edge) --> Expo Push Service --> APNs / FCM --> Mobile Device
```

### 1.2 トークン管理

| フェーズ | 処理 | 保存先 |
|---------|------|--------|
| 初回起動 | 許可リクエスト | - |
| 許可取得 | トークン発行 | Supabase |
| ログイン | トークン紐付け | push_tokens |
| 更新 | トークン再取得 | upsert |

### 1.3 push_tokensテーブル設計

| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid | PK |
| user_id | uuid | FK users |
| token | text | Expo Push Token |
| platform | text | ios / android |
| device_id | text | デバイス識別子 |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

### 1.4 許可リクエスト

```typescript
// lib/notifications/permissions.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId,
  });

  return token.data;
}
```

### 1.5 トークン保存

```typescript
// lib/notifications/register.ts
export async function savePushToken(userId: string, token: string) {
  await supabase
    .from('push_tokens')
    .upsert({
      user_id: userId,
      token,
      platform: Platform.OS,
      updated_at: new Date().toISOString(),
    });
}
```

## 2. 通知種別設計

### 2.1 通知カテゴリ

| カテゴリ | トリガー | 優先度 |
|---------|---------|--------|
| タスク期限 | 期限24時間前 | high |
| タスク割当 | 新規割当時 | default |
| コメント | コメント追加 | default |
| ステータス変更 | 完了時等 | low |
| リマインダー | 設定時刻 | default |

### 2.2 通知ペイロード設計

```json
{
  "to": "ExponentPushToken[xxx]",
  "title": "タスク期限",
  "body": "「企画書作成」の期限が近づいています",
  "sound": "default",
  "badge": 1,
  "data": {
    "type": "task_due",
    "taskId": "uuid",
    "action": "open_task"
  }
}
```

### 2.3 ディープリンク設計

| 通知タイプ | ディープリンク | 画面 |
|-----------|--------------|------|
| task_due | /tasks/{id} | タスク詳細 |
| task_assigned | /tasks/{id} | タスク詳細 |
| comment | /tasks/{id}#comments | コメント |
| reminder | /dashboard | ダッシュボード |

### 2.4 通知ハンドラー

```typescript
// app/_layout.tsx
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (data.taskId) {
          router.push(`/tasks/${data.taskId}`);
        }
      }
    );

    return () => subscription.remove();
  }, []);

  return <Stack />;
}
```

### 2.5 サーバーからの通知送信

```typescript
// api/send-notification.ts (server-side)
export async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: object
) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data,
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}
```

## 3. オフラインストレージ設計

### 3.1 ストレージ選定

| ストレージ | 用途 | 特徴 |
|-----------|------|------|
| AsyncStorage | 設定・キャッシュ | シンプル |
| WatermelonDB | 構造化データ | 同期対応 |
| SQLite | 大量データ | 高性能 |

### 3.2 WatermelonDBスキーマ

```
ローカルデータベース構造
---
tasks
  id (string, PK)
  title (string)
  status (string)
  due_date (number, nullable)
  synced_at (number, nullable)
  is_dirty (boolean)

sync_metadata
  id (string, PK)
  last_pulled_at (number)
  last_pushed_at (number)
```

### 3.3 スキーマ定義

```typescript
// db/schema.ts
import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'tasks',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'due_date', type: 'number', isOptional: true },
        { name: 'synced_at', type: 'number', isOptional: true },
        { name: 'is_dirty', type: 'boolean' },
      ],
    }),
  ],
});
```

### 3.4 モデル定義

```typescript
// db/models/Task.ts
import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export class Task extends Model {
  static table = 'tasks';

  @field('title') title!: string;
  @field('status') status!: string;
  @date('due_date') dueDate?: Date;
  @field('is_dirty') isDirty!: boolean;
}
```

### 3.5 同期状態管理

| 状態 | is_dirty | synced_at | 説明 |
|------|----------|-----------|------|
| 同期済 | false | 値あり | サーバーと一致 |
| ローカル変更 | true | 値あり | プッシュ待ち |
| 新規作成 | true | null | 未同期 |
| 削除待ち | deleted | - | soft delete |

## 4. 同期戦略設計

### 4.1 同期フロー

```
オンライン復帰時の同期フロー

ネットワーク状態検知
       |
       v
Pull Changes (サーバー→ローカル) --> コンフリクト解決
       |
       v
Push Changes (ローカル→サーバー)
       |
       v
is_dirty = false / synced_at 更新
```

### 4.2 コンフリクト解決ポリシー

| ケース | 解決方法 | 理由 |
|--------|---------|------|
| 両方更新 | Last Write Wins | シンプル |
| ローカル削除・サーバー更新 | サーバー優先 | データ保持 |
| サーバー削除・ローカル更新 | 警告表示 | ユーザー判断 |

### 4.3 同期サービス

```typescript
// lib/sync/syncService.ts
import { synchronize } from '@nozbe/watermelondb/sync';

export async function syncDatabase() {
  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt }) => {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .gt('updated_at', lastPulledAt || 0);

      return {
        changes: { tasks: { created: data, updated: [], deleted: [] } },
        timestamp: Date.now(),
      };
    },
    pushChanges: async ({ changes }) => {
      for (const task of changes.tasks.created) {
        await supabase.from('tasks').insert(task);
      }
      for (const task of changes.tasks.updated) {
        await supabase.from('tasks').update(task).eq('id', task.id);
      }
    },
  });
}
```

### 4.4 ネットワーク状態監視

```typescript
// hooks/useOnlineStatus.ts
import NetInfo from '@react-native-community/netinfo';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  return isOnline;
}
```

### 4.5 オンライン復帰時の自動同期

```typescript
function App() {
  const isOnline = useOnlineStatus();
  const prevOnline = useRef(isOnline);

  useEffect(() => {
    if (isOnline && !prevOnline.current) {
      syncDatabase();
    }
    prevOnline.current = isOnline;
  }, [isOnline]);

  return <AppContent />;
}
```

## 5. バックグラウンド同期設計

### 5.1 同期タイミング

| タイミング | トリガー | 処理 |
|-----------|---------|------|
| フォアグラウンド | アプリ起動 | フル同期 |
| オンライン復帰 | ネットワーク変化 | 差分同期 |
| バックグラウンド | 15分間隔 | 差分同期 |
| プッシュ受信 | サイレント通知 | 対象のみ |

### 5.2 バッテリー考慮

| 設定 | 値 | 理由 |
|------|-----|------|
| 最小間隔 | 15分 | iOS制限 |
| 低バッテリー時 | 無効 | 省電力 |
| WiFi時のみ | オプション | データ節約 |

### 5.3 バックグラウンドフェッチ

```typescript
// lib/background/fetch.ts
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_SYNC_TASK = 'background-sync';

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    await syncDatabase();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundSync() {
  await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
    minimumInterval: 15 * 60, // 15 minutes
    stopOnTerminate: false,
    startOnBoot: true,
  });
}
```

## 6. ネットワーク状態管理

### 6.1 状態遷移

```
           +-- 切断 -->
Online <-->            Offline
           <-- 接続 --
      |                |
      +----+-------+---+
           |
           v
      同期キュー処理
```

### 6.2 オフライン時のUI

| 状態 | 表示 | 操作 |
|------|------|------|
| オフライン | バナー表示 | 読み取りのみ許可 |
| 同期中 | スピナー | 操作制限 |
| 同期完了 | トースト | 通常操作 |
| 同期エラー | エラーバナー | リトライボタン |

## 7. 実装チェックリスト

- [x] プッシュ通知のフローを設計した
- [x] push_tokensテーブルを設計した
- [x] 通知カテゴリと優先度を設計した
- [x] ディープリンク設計を完了した
- [x] オフラインストレージ構造を設計した
- [x] 同期戦略を設計した
- [x] コンフリクト解決ポリシーを策定した
- [x] バックグラウンド同期を設計した
