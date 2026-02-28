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
- AIエージェント利用時は `AGENTS.md` の規約を優先してください。
