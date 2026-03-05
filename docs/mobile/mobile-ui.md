# モバイルUI設計書

## 1. UIライブラリ選定

| ライブラリ | 特徴 | 採用理由 |
|-----------|------|----------|
| Tamagui | Web/Native両対応 | モノレポで共有可能 |
| NativeWind | Tailwind CSS風 | Webと同じ記法 |
| React Native Paper | Material Design | Google準拠 |

### 1.1 Tamagui採用の理由

| メリット | 説明 |
|---------|------|
| Web/Native両対応 | 同じコンポーネントをReact/React Nativeで使用 |
| 高パフォーマンス | コンパイル時にスタイル最適化 |
| デザイントークン | テーマ対応（ダークモード等） |

### 1.2 Tamagui設定

```typescript
// tamagui.config.ts
import { createTamagui } from 'tamagui';
import { config } from '@tamagui/config/v3';

const appConfig = createTamagui(config);

export default appConfig;
export type AppConfig = typeof appConfig;
```

### 1.3 プロバイダー設定

```typescript
// app/_layout.tsx
import { TamaguiProvider } from 'tamagui';
import config from '../tamagui.config';

export default function RootLayout() {
  return (
    <TamaguiProvider config={config}>
      <Stack />
    </TamaguiProvider>
  );
}
```

## 2. コンポーネント設計

### 2.1 基本コンポーネント

| コンポーネント | 用途 | Tamaguiコンポーネント |
|---------------|------|----------------------|
| ボタン | アクション | Button |
| 入力 | テキスト入力 | Input |
| カード | 情報表示 | Card |
| リスト | 一覧表示 | YStack + XStack |
| モーダル | オーバーレイ | Sheet / Dialog |

### 2.2 共通レイアウト

```
+-------------------------------------+
|  Header (SafeAreaView)              |
+-------------------------------------+
|                                     |
|                                     |
|         Main Content                |
|         (ScrollView)                |
|                                     |
|                                     |
+-------------------------------------+
|  Tab Bar (Bottom)                   |
+-------------------------------------+
```

### 2.3 コンポーネント使用例

```typescript
import { Button, Input, Text, YStack, XStack } from 'tamagui';

function LoginForm() {
  return (
    <YStack space="$4" padding="$4">
      <Text fontSize="$8" fontWeight="bold">ログイン</Text>
      <Input placeholder="メールアドレス" />
      <Input placeholder="パスワード" secureTextEntry />
      <Button theme="blue">ログイン</Button>
    </YStack>
  );
}
```

## 3. ジェスチャー設計

### 3.1 対応ジェスチャー一覧

| ジェスチャー | 用途 | 実装ライブラリ |
|-------------|------|---------------|
| タップ | 選択・実行 | Pressable |
| 長押し | コンテキストメニュー | GestureHandler |
| スワイプ | 削除・アーカイブ | GestureHandler |
| ドラッグ | 並び替え | Reanimated |
| ピンチ | ズーム | GestureHandler |
| プルダウン | リフレッシュ | RefreshControl |

### 3.2 スワイプ削除フロー

```
  初期状態          スワイプ中         削除判定
+-----------+     +-----------+     +-----------+
|   Item    | --> |   Item  < | --> |   Delete  |
+-----------+     +-----------+     +-----------+
                   <-- 50px          <-- 100px以上
                   (赤背景表示)     (削除実行)
```

### 3.3 スワイプ削除実装

```typescript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

function SwipeableItem({ onDelete, children }) {
  const translateX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = Math.min(0, event.translationX);
    })
    .onEnd(() => {
      if (translateX.value < -100) {
        runOnJS(onDelete)();
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
```

### 3.4 プルリフレッシュ

```typescript
import { RefreshControl, FlatList } from 'react-native';

function TaskList() {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  return (
    <FlatList
      data={tasks}
      renderItem={({ item }) => <TaskItem task={item} />}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
  );
}
```

## 4. アニメーション設計

### 4.1 アニメーション原則

| 原則 | 説明 | 実装 |
|------|------|------|
| 60fps維持 | スムーズな動き | useNativeDriver: true |
| 意味のある動き | 操作フィードバック | タップ時scale |
| 適切な持続時間 | 200-300ms | withSpring/withTiming |
| イージング | 自然な動き | Easing.bezier |

### 4.2 トランジション種別

| トランジション | 用途 | 設定 |
|---------------|------|------|
| Fade | モーダル表示 | opacity 0→1 |
| Slide | 画面遷移 | translateX |
| Scale | ボタンフィードバック | scale 0.95→1 |
| Spring | リスト追加 | damping, stiffness |

## 5. ナビゲーション設計

### 5.1 ナビゲーション構造

```
RootStack
+-- (auth) [Stack]
|   +-- login
|   +-- signup
+-- (app) [Tabs]
    +-- dashboard [Stack]
    |   +-- index
    |   +-- [detail]
    +-- tasks [Stack]
    |   +-- index
    |   +-- [id]
    +-- settings [Stack]
        +-- index
        +-- profile
```

### 5.2 タブバー設計

| タブ | アイコン | ラベル |
|------|---------|-------|
| ホーム | Home | ホーム |
| タスク | CheckSquare | タスク |
| 設定 | Settings | 設定 |

### 5.3 タブナビゲーション実装

```typescript
// app/(app)/_layout.tsx
import { Tabs } from 'expo-router';
import { Home, CheckSquare, Settings } from 'lucide-react-native';

export default function AppLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'ホーム',
          tabBarIcon: ({ color }) => <Home color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'タスク',
          tabBarIcon: ({ color }) => <CheckSquare color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
          tabBarIcon: ({ color }) => <Settings color={color} />,
        }}
      />
    </Tabs>
  );
}
```

## 6. レスポンシブ設計

### 6.1 ブレークポイント

| デバイス | 幅 | レイアウト |
|---------|-----|-----------|
| Phone | < 768px | シングルカラム |
| Tablet Portrait | 768-1024px | 2カラム |
| Tablet Landscape | > 1024px | サイドバー + コンテンツ |

### 6.2 画面サイズ検出

```typescript
import { useWindowDimensions } from 'react-native';

function useDeviceType() {
  const { width } = useWindowDimensions();

  return {
    isPhone: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
  };
}
```

### 6.3 レスポンシブレイアウト

```typescript
function Dashboard() {
  const { isTablet } = useDeviceType();

  return (
    <View style={{ flexDirection: isTablet ? 'row' : 'column' }}>
      <Sidebar style={{ width: isTablet ? 250 : '100%' }} />
      <MainContent style={{ flex: 1 }} />
    </View>
  );
}
```

### 6.4 タブレット対応

```
Phone                    Tablet
+----------+            +---------+------------+
|          |            | Sidebar |            |
|  Content |            |         |  Content   |
|          |            |         |            |
+----------+            |         |            |
|  Tabs    |            |         |            |
+----------+            +---------+------------+
```

## 7. ボトムシート設計

### 7.1 スナップポイント

| 状態 | 高さ | 用途 |
|------|------|------|
| Collapsed | 25% | プレビュー |
| Half | 50% | 基本操作 |
| Expanded | 90% | 詳細表示 |

### 7.2 ボトムシート実装

```typescript
import BottomSheet from '@gorhom/bottom-sheet';

function TaskDetail() {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);

  return (
    <BottomSheet ref={bottomSheetRef} snapPoints={snapPoints}>
      <View>
        <Text>タスク詳細</Text>
      </View>
    </BottomSheet>
  );
}
```

## 8. 実装チェックリスト

- [x] Tamaguiの設定方針を策定した
- [x] 基本コンポーネント一覧を設計した
- [x] ジェスチャー対応一覧を設計した
- [x] アニメーション原則を策定した
- [x] タブナビゲーション構造を設計した
- [x] レスポンシブ対応方針を設計した
- [x] ボトムシート仕様を設計した
