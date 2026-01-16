# Phase 26: バージョン管理 & 脆弱性対応 - Runbook

## 概要

本番運用開始後のバージョン管理・脆弱性対応を学びます。
Dependabotによる自動監視、四半期パッケージレビュー、CVE対応の手順を習得します。

## 習得する概念

| 概念 | 説明 |
|------|------|
| **Dependabot** | GitHub提供の自動脆弱性監視・更新ツール |
| **SemVer** | MAJOR.MINOR.PATCH形式のバージョン番号規則 |
| **npm audit** | 依存パッケージの脆弱性チェックツール |
| **CVE** | 共通脆弱性識別子（Common Vulnerabilities and Exposures） |

## 前提条件

- [x] Phase 25 完了（Part 9 基礎編完了）
- [x] `.github/dependabot.yml` 設定済み

---

## Step 1: Dependabot設定の強化

### 1.1 現在の設定確認

```bash
cat .github/dependabot.yml
```

### 1.2 セキュリティアラート用の設定追加

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
      timezone: "Asia/Tokyo"
    open-pull-requests-limit: 10
    labels: ["dependencies", "automated"]
    commit-message:
      prefix: "chore(deps)"
    groups:
      # パッチ・マイナーはグループ化
      minor-and-patch:
        patterns: ["*"]
        update-types: ["minor", "patch"]
      # メジャーは個別PR
      major:
        patterns: ["*"]
        update-types: ["major"]
    # セキュリティアップデートの優先度設定
    reviewers:
      - "Mickey-Takeshi"

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    labels: ["dependencies", "ci"]
    commit-message:
      prefix: "chore(ci)"
```

**確認ポイント:**
- [ ] dependabot.yml が正しく設定されている
- [ ] 週次スケジュール（月曜 09:00 JST）が設定されている
- [ ] グループ化設定が有効になっている

---

## Step 2: TECH-STACK-VERSIONS.md 作成

### 2.1 技術スタックバージョン管理ファイル

```markdown
# docs/specs/TECH-STACK-VERSIONS.md

# 技術スタックバージョン管理

## 現在のバージョン

| パッケージ | バージョン | 最終更新 | 備考 |
|-----------|-----------|---------|------|
| next | 15.x | 2025-01 | App Router使用 |
| react | 19.x | 2025-01 | React 19対応 |
| typescript | 5.x | 2025-01 | strict mode |
| @supabase/supabase-js | 2.x | 2025-01 | 認証・DB |
| zod | 3.x | 2025-01 | バリデーション |
| vitest | 2.x | 2025-01 | ユニットテスト |
| playwright | 1.x | 2025-01 | E2Eテスト |

## 更新履歴

### 2025-01-XX
- Phase 26 実装開始
- 初期バージョン記録

## SemVer ルール

| 更新タイプ | 例 | 対応方針 |
|-----------|-----|---------|
| パッチ | 1.0.0 → 1.0.1 | 即時適用可 |
| マイナー | 1.0.0 → 1.1.0 | 型チェック後に適用 |
| メジャー | 1.0.0 → 2.0.0 | 影響調査必須 |

## 脆弱性対応ポリシー

| 深刻度 | 対応期限 |
|--------|---------|
| Critical | 24時間以内 |
| High | 72時間以内 |
| Medium | 1週間以内 |
| Low | 次回四半期レビュー |
```

**確認ポイント:**
- [ ] docs/specs/ ディレクトリが存在する
- [ ] TECH-STACK-VERSIONS.md が作成されている

---

## Step 3: npm audit スクリプト追加

### 3.1 package.json にスクリプト追加

```json
{
  "scripts": {
    "audit:check": "npm audit --audit-level=moderate",
    "audit:fix": "npm audit fix",
    "outdated": "npm outdated",
    "deps:check": "npm run outdated && npm run audit:check"
  }
}
```

### 3.2 実行例

```bash
# 依存関係チェック
npm run deps:check

# 脆弱性確認
npm run audit:check

# 自動修正可能なものを修正
npm run audit:fix
```

**確認ポイント:**
- [ ] audit:check スクリプトが追加されている
- [ ] npm run audit:check が実行できる

---

## Step 4: 四半期レビュー手順書

### 4.1 レビュー実行手順

```bash
# 1. 現状確認
npm outdated
npm audit

# 2. パッチ・マイナー更新（安全）
npm update

# 3. 型チェック
npm run type-check

# 4. テスト実行
npm run test
npm run test:e2e

# 5. ビルド確認
npm run build
```

### 4.2 メジャー更新の調査テンプレート

```markdown
## メジャーアップデート調査: [パッケージ名]

### 現在のバージョン
- 現在: x.x.x
- 最新: y.y.y

### 破壊的変更
1. [変更点1]
2. [変更点2]

### FDCへの影響
- [ ] 影響なし
- [ ] 影響あり（詳細: ）

### 対応方針
- [ ] 即時アップデート
- [ ] 次回リリースでアップデート
- [ ] 見送り（理由: ）
```

**確認ポイント:**
- [ ] npm outdated で更新可能なパッケージを確認できる
- [ ] npm audit で脆弱性を確認できる

---

## Step 5: CVE対応フロー

### 5.1 CVE検知時の対応手順

```
1. CVE番号を確認
   例: CVE-2025-XXXXX

2. 影響範囲を調査
   - 該当パッケージの特定
   - 修正バージョンの確認

3. アップデート実行
   npm install [package]@[fixed-version]

4. 検証
   npm run type-check
   npm run test
   npm run build

5. デプロイ
   git add -A
   git commit -m "fix(security): patch CVE-2025-XXXXX"
   git push
```

### 5.2 CVE対応の実例

```bash
# 例: Next.js の CVE 対応
npm install next@latest react@latest react-dom@latest

# 検証
npm run type-check
npm run build

# コミット
git add -A
git commit -m "fix(security): patch CVE-2025-55184 (DoS) and CVE-2025-55183 (Source Code Exposure)"
git push
```

**確認ポイント:**
- [ ] CVE対応フローを理解した
- [ ] 緊急時の対応手順を把握した

---

## Step 6: GitHub Security Alerts 設定

### 6.1 リポジトリ設定確認

GitHubリポジトリの Settings → Security で以下を確認:

1. **Dependabot alerts**: Enabled
2. **Dependabot security updates**: Enabled
3. **Code scanning alerts**: 検討（オプション）

### 6.2 通知設定

GitHub → Settings → Notifications で:
- Security alerts を Email で受信設定

**確認ポイント:**
- [ ] GitHub Security Alerts が有効になっている
- [ ] Dependabot alerts が有効になっている

---

## Step 7: 検証

### 7.1 設定確認

```bash
# Dependabot設定確認
cat .github/dependabot.yml

# package.json スクリプト確認
npm run audit:check
npm run outdated

# 型チェック・ビルド
npm run type-check
npm run build
```

### 7.2 動作確認

```bash
# 依存関係の状態確認
npm outdated

# 脆弱性チェック
npm audit
```

---

## 成果物

| ファイル | 説明 |
|---------|------|
| `.github/dependabot.yml` | Dependabot設定（更新） |
| `docs/specs/TECH-STACK-VERSIONS.md` | 技術スタックバージョン管理 |
| `package.json` | audit スクリプト追加 |

---

## 完了チェック

- [ ] Dependabot の仕組みを理解した
- [ ] SemVer（MAJOR.MINOR.PATCH）を理解した
- [ ] npm audit の使い方を理解した
- [ ] 四半期レビュー手順を理解した
- [ ] CVE対応フローを理解した
- [ ] TECH-STACK-VERSIONS.md を作成した
- [ ] GitHubにプッシュした（Vercelデプロイ成功を確認）
