# Repository Guidelines

## プロジェクト構成とモジュール
- `app/`: Expo Router の画面。グループ `(drawer)/(modal)` と `_layout.tsx` を利用。
- `components/`: 再利用 UI（PascalCase）。例: `components/common/Header.tsx`。
- `features/`: ドメイン別の状態/サービス（Zustand, 通知, 予定, 課金 等）。
- `lib/`: 横断ユーティリティ。例: `lib/date/`、`lib/ads/`。
- `assets/`: 画像・音源・アイコン。`locales/`: i18n（`ja.json`）。
- 設定: `app.json`（Expo）、`eas.json`、`tailwind.config.js`、`metro.config.js`、`eslint.config.js`。

## ビルド・実行・開発
- 依存関係: `npm install`
- 開発起動: `npm run start`（QR/Device/Emulator 選択）
- Android/iOS: `npm run android` / `npm run ios`
- Web: `npm run web`
- Lint: `npm run lint`
- 初期化: `npm run reset-project`（テンプレートを整理）

## コーディング規約・命名
- 言語: TypeScript（`tsconfig` は `strict: true`）。パスエイリアス `@/*` を使用。
- ESLint: Expo 推奨設定。PR 前に警告ゼロを維持。
- コンポーネント: PascalCase（例: `ColorPicker.tsx`）。ルート/画面は小文字で機能名（例: `week.tsx`）。
- インデント: スペース2。スタイルは NativeWind/Tailwind を優先（`global.css`）。
- Tailwind クラスは意味順で整理（必要なら Prettier 導入を検討）。

## テスト方針
- 現時点で自動テストは未導入。
- 追加時の推奨: React Native Testing Library + Vitest。
- 置き場所/命名: 対象ファイルと同階層に `*.test.ts(x)`。
- 将来目標: 重要ロジック（`features/*`、`lib/*`）の80%カバレッジ。

## コミット＆プルリク
- 形式: Conventional Commits を推奨（英語・命令形）。例: `feat(calendar): add week timeline`、`fix(notifications): ensure delivery`。
- PR 必須項目: 目的/要約、変更点、スクリーンショット（UI変更時）、関連Issue、動作確認手順、`npm run lint` 済。
- 変更は小さく論理的に分割。`console.log` は削除。

## セキュリティ・設定の注意
- 秘密情報（広告ID/課金キー等）はハードコード禁止。EAS Secrets や環境変数（`EXPO_PUBLIC_*` 以外はクライアントへ露出不可）を利用。
- 通知/広告の権限・設定は OS ごとに確認（`expo-notifications`、`react-native-google-mobile-ads`）。

## アーキテクチャ指針
- 状態は `features/*/store.ts`（Zustand）に集約、副作用は `service.ts` へ分離。
- 共有ロジックは `lib/` に配置。画面からは `@/features/...` 経由で参照。
