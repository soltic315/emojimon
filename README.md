# Emojimon

Emojimon は TypeScript + Phaser 3 + Vite で開発しているブラウザゲームプロジェクトです。  
この README は **セットアップ・開発手順・運用情報** のみを扱います。  
ゲーム仕様は `GAME_DESIGN.md` を参照してください。

---

## ドキュメントの役割

- `README.md`: 開発環境、実行手順、品質確認、運用ルール
- `GAME_DESIGN.md`: ゲーム仕様の一次情報
- `AGENTS.md`: AI/開発者の作業規約

---

## 必要環境

- Node.js 20 以上推奨
- npm 10 以上推奨
- モダンブラウザ（Chrome / Edge / Firefox / Safari）

### 主要依存ライブラリ

- [Phaser 3](https://phaser.io/) — ゲームエンジン
- [Tone.js](https://tonejs.github.io/) — プロシージャルオーディオ合成（BGM・SE）
- [GSAP](https://gsap.com/) — アニメーション
- [Vite](https://vitejs.dev/) — ビルドツール

---

## セットアップ

```bash
npm install
```

---

## 開発コマンド

```bash
# 開発サーバ
npm run dev

# Lint
npm run lint

# Type check
npm run typecheck

# Unit test
npm run test

# 本番ビルド
npm run build

# ビルド結果プレビュー
npm run preview
```

---

## 日常運用フロー

1. 変更対象のコードと依存ファイルを確認
2. 最小差分で実装
3. `npm run lint` → `npm run typecheck` → `npm run test`
4. 仕様変更がある場合は `GAME_DESIGN.md` を更新
5. 運用手順の変更がある場合は `README.md` を更新

---

## GitHub Pages デプロイ運用

- 公開URL: https://soltic315.github.io/emojimon/
- `main` ブランチへの push で `.github/workflows/deploy.yml` が実行されます。
- ワークフローは Pages サイト未作成時に自動有効化を試みます。
- 自動有効化に失敗した場合は、リポジトリ設定の **Pages > Build and deployment** を `GitHub Actions` に設定してください。
- 必要権限が不足している場合（管理者権限なしなど）は、リポジトリ管理者による設定が必要です。

---

## ディレクトリ概要

```
assets/data/            # ゲームデータJSON
js/
  audio/                # サウンド関連
  data/                 # ルール・データ処理
  scenes/               # シーン実装
  state/                # グローバル状態
  ui/                   # 共通UI
tests/                  # ユニットテスト
```

---

## 補足

- 新規の仕様追加・調整は、実装と同時に `GAME_DESIGN.md` へ反映してください。
- セーブは LocalStorage のメイン + バックアップを保持し、メイン破損時はバックアップからの復旧を試行します。
- UI実装は `phaser3-rex-plugins`（RexUI）を標準とし、原則として `this.rexUI.add` 経由で構築してください。
- AIエージェント利用時は `AGENTS.md` の規約を優先してください。
- AIチャットログ運用では、要約ログを保存しつつ会話生ログ（全文）も必ず保存してください。
