# CHANGELOG

## [1.20.0] - 2026-03-02

### Note
- バトルリソースを技ごとのPPからモンスター共通のスタミナへ移行し、毎ターン回復するシンプルな運用へ統一した。

### Added
- `js/data/monsters.ts` にモンスター共通スタミナ管理（最大値・正規化・ターン回復）ユーティリティを追加。
- `js/data/moves.ts` に `getMoveStaminaCost()` を追加し、技ごとのスタミナ消費コストを解決する処理を追加。

### Changed
- `js/scenes/battle/battleTurnFlow.ts` / `js/scenes/BattleScene.ts` / `js/scenes/battle/battleMenu.ts` を更新し、技使用時の判定をPP残量からスタミナ消費へ変更。あわせてプレイヤー/相手のターン開始時にスタミナを1回復する仕様へ変更。
- `js/scenes/battle/battleItems.ts` と `js/scenes/MenuScene.ts` の `healAllPP` 効果を、PP回復からスタミナ回復へ変更。
- `js/data/wildEncounters.ts` / `js/scenes/WorldScene.ts` / `js/scenes/world/worldTrainerArena.ts` / `js/scenes/battle/battleCatch.ts` のモンスター初期化を `pp` から `stamina` へ移行。
- `js/state/saveSchema.ts` / `js/state/gameState.ts` を更新し、セーブデータの保持値を `pp` 配列から `stamina` 数値へ移行（旧 `pp` はロード互換として受理）。
- `types/game.d.ts` / `js/data/dataValidation.ts` / `tests/moves.test.ts` / `tests/dataValidation.test.ts` を更新し、技定義を `staminaCost` 基準へ移行。
- `assets/data/items.json` / `js/scenes/menu/menuConstants.ts` / `GAME_DESIGN.md` の文言・仕様記述をPP表現からスタミナ表現へ同期。
- `package.json` と `package-lock.json` のバージョンを `1.19.0` から `1.20.0` に更新。

### Fixed
- 技ごとのPP管理が複数箇所に分散し、UI・AI・回復処理の整合が取りづらかった問題を、モンスター共通スタミナへ統一して解消。

### Prompt
- User: `システムのシンプル化のために技のPPを廃止してスタミナに移行してください`
- User: `スタミナはターンごとに回復します`
- Assistant（対応方針）: バトル/AI/回復アイテム/生成/セーブ/UI/仕様書を一括で最小差分移行し、スタミナをターン開始時に回復する共通ルールへ統一する。

## [1.19.0] - 2026-03-02

### Note
- クエスト画面の表示方針を見直し、ネタバレを抑えつつ各クエストの進行判断がしやすい構成へ更新した。

### Added
- `js/scenes/menu/views/questView.ts` に、クエストごとの進捗表示（達成ステップ数）と次アクションのヒント表示を追加。

### Changed
- `js/scenes/menu/views/questView.ts` の表示条件を更新し、ストーリークエストは最初から常時表示、サブクエスト/ポストゲーム目標は当該トリガー到達後のみ表示する仕様へ変更。
- `GAME_DESIGN.md` のメニュー仕様（9.3）を更新し、クエスト表示条件と進捗/ヒント表示ルールを実装に同期。
- `package.json` と `package-lock.json` のバージョンを `1.18.7` から `1.19.0` に更新。

### Fixed
- 未到達クエストが先に一覧表示されることで発生していた、進行ネタバレと導線ノイズを軽減。

### Prompt
- User: `ネタバレ防止のため、クエストは当該クエストのトリガーを踏んだものだけ表示されるようにしてください`
- User: `ストーリーは最初から表示された状態にしてください`
- User: `クエストごとに進捗やヒントを表示するようにしてください`
- Assistant（対応方針）: `questView` をトリガー表示制御 + 進捗/ヒント表示へ更新し、仕様書・版数・検証結果を最小差分で同期する。

## [1.18.7] - 2026-03-02

### Note
- 名前入力・ニックネーム入力を「ポップアップなしのキーボード直接入力」に統一し、IME（日本語入力）とUI表示の不具合を解消した。

### Added
- なし

### Changed
- `js/scenes/title/titleNameInput.ts` を更新し、タイトルの名前入力UIを専用パネル表示へ戻したうえで、非表示HTML入力を利用した直接入力（IME対応）へ変更。
- `js/scenes/menu/menuSceneNickname.ts` を更新し、ニックネーム入力を非表示HTML入力ベースの直接入力（IME対応）へ変更。
- `js/scenes/MenuScene.ts` を更新し、ニックネーム入力モード時のキーイベント処理を直接入力仕様に合わせて調整。
- `GAME_DESIGN.md` のニックネーム仕様を、ゲーム内キーボード方式から直接入力方式へ更新。
- `package.json` と `package-lock.json` のバージョンを `1.18.6` から `1.18.7` に更新。

### Fixed
- タイトルで「はじめから」を選択しても入力画面が視認しづらい／表示されない問題を修正。
- 直接入力化後にIME経由の日本語入力が反映されない問題を修正。

### Prompt
- User: `文字はキーボードから直接入力する形にしてください（ポップアップウィンドウは禁止）`
- User: `日本語入力できない / タイトルの入力画面が表示されない`
- Assistant（対応方針）: 仮想キーボードを廃止して直接入力へ統一し、IME対応の入力経路とタイトル入力パネル表示を最小差分で復旧する。

## [1.18.6] - 2026-03-02

### Note
- テスト基盤の将来互換性と依存整合性のため、`Vitest` を `4.x` へ更新した。

### Added
- なし

### Changed
- `package.json` の `devDependencies` にある `vitest` を `^4.0.18` へ更新。
- `package.json` と `package-lock.json` のバージョンを `1.18.5` から `1.18.6` に更新。

### Fixed
- なし

### Prompt
- User: `Vitest を 4.x に上げて`
- Assistant（対応方針）: `Vitest` を 4系へ最小差分で更新し、`lint/typecheck/test/build` の順で成功を確認して版数・履歴を同期する。

## [1.18.5] - 2026-03-02

### Note
- ビルド高速化のため、ビルド基盤を `Vite 8（Rolldown）` へ移行した。

### Added
- なし

### Changed
- `package.json` の `devDependencies` にある `vite` を `^8.0.0-beta.16` へ更新。
- `README.md` の技術スタック表記を `Vite 8（Rolldown）` に更新。
- `AGENTS.md` の技術スタック表記を `Vite 8（Rolldown）` に更新。
- `package.json` と `package-lock.json` のバージョンを `1.18.4` から `1.18.5` に更新。

### Fixed
- なし

### Prompt
- User: `ビルド高速化のためにVite 8（Rolldown）に移行してください`
- Assistant（対応方針）: npm 上で利用可能な `Vite 8 beta` へ最小差分で移行し、関連ドキュメント・版数・検証コマンド結果を同期する。

## [1.18.4] - 2026-03-02

### Note
- `oxlint` の warning を全解消し、lint 実行結果を `0 warnings` へ統一した。

### Added
- なし

### Changed
- `js/scenes/BattleScene.ts` の未使用 import と未使用引数を整理。
- `js/scenes/battle/battleResultRewards.ts` / `js/scenes/battle/battleHudUpdate.ts` / `js/scenes/battle/battleMessageFlow.ts` の未使用 import・未使用引数を整理。
- `js/scenes/BootScene.ts` / `js/scenes/WorldScene.ts` / `js/scenes/world/worldMapData.ts` / `js/scenes/menu/views/pokedexView.ts` の未使用 import・未使用引数を整理。
- `package.json` と `package-lock.json` のバージョンを `1.18.3` から `1.18.4` に更新。

### Fixed
- `npm run lint` 実行時に `no-unused-vars` warning が多数発生していた状態を解消。

### Prompt
- User: `lintのWarningを解消して`
- Assistant（対応方針）: warning 発生箇所を集計し、未使用 import / 未使用引数を最小差分で削除して `oxlint` warning を 0 件にする。

## [1.18.3] - 2026-03-02

### Note
- TypeScript の実行基盤を安定版 `tsc` から、プレリリースの `tsgo`（TypeScript 7 preview）へ移行した。

### Added
- `package.json` の `devDependencies` に `@typescript/native-preview`（`tsgo`）を追加。

### Changed
- `package.json` の `typecheck` を `tsc -p tsconfig.json --noEmit` から `tsgo -p tsconfig.json --noEmit` へ変更。
- `package.json` の `devDependencies` から `typescript` を削除。
- `AGENTS.md` の技術スタック表記を `oxlint / TypeScript / Vitest` から `oxlint / tsgo / Vitest` へ更新。
- `README.md` の主要依存ライブラリへ `TypeScript Native Preview (tsgo)` を追記し、Type check コマンド表記を `tsgo` 前提へ更新。
- `package.json` と `package-lock.json` のバージョンを `1.18.2` から `1.18.3` に更新。

### Fixed
- 非安定版 TypeScript 系ツールチェーンへ移行する際に、`typecheck` が `tsc` 固定になっていた運用上の不整合を解消。

### Prompt
- User: `安定版ではなくてもいいです ESLint/tscはやめてoxlint/tsgoにしてください`
- Assistant（対応方針）: `oxlint` を維持しつつ、`typecheck` 実行基盤を `tsgo` へ置換し、依存・ドキュメント・版数・履歴を最小差分で同期する。

## [1.18.2] - 2026-03-02

### Note
- Lint ツールを `ESLint` から `oxlint` へ移行し、Lint 実行の高速化と設定の簡素化を行った。

### Added
- なし

### Changed
- `package.json` の `lint` を `eslint .` から `oxlint js tests vite.config.ts` へ変更。
- `package.json` の `devDependencies` を更新し、`eslint` 系依存（`eslint/@eslint/js/@typescript-eslint/parser/globals`）を削除して `oxlint` を追加。
- `AGENTS.md` の技術スタック表記を `ESLint` から `oxlint` へ更新。
- `README.md` の主要依存ライブラリへ `oxlint` を追記。
- `package.json` と `package-lock.json` のバージョンを `1.18.0` から `1.18.2` に更新。

### Fixed
- Lint 実行が `eslint` 前提の構成に固定されていたため、`oxlint` ベースの高速運用へ切り替えづらい問題を解消。

### Prompt
- User: `ESlintを辞めてoxlintに移行してください`
- Assistant（対応方針）: `lint` 実行基盤を `oxlint` へ最小差分で置換し、依存関係・運用ドキュメント・版数・履歴を同期する。

## [1.18.0] - 2026-03-02

### Note
- バトル編成ルールを調整し、敵味方の持ち歩き上限を3体へ統一した。

### Added
- `js/state/gameState.ts` に `PARTY_CAPACITY` 定数を追加し、パーティ上限値を一元化。
- `js/state/gameState.ts` のロード処理に、旧セーブで上限超過している個体をボックスへ退避する補正を追加。

### Changed
- `js/scenes/battle/battleConstants.ts` の `PARTY_MAX` を `PARTY_CAPACITY` 参照へ変更。
- `js/scenes/MenuScene.ts` / `js/scenes/menu/views/boxView.ts` / `js/scenes/world/worldTrainerArena.ts` の上限判定を3体仕様へ更新。
- `js/scenes/WorldScene.ts` の捕獲チュートリアル文言を3体上限に更新。
- `js/scenes/menu/menuConstants.ts` のガイド文言を3体上限に更新。
- `js/data/achievements.ts` の `PARTY_FULL` 実績条件と説明を3体基準へ更新。
- `GAME_DESIGN.md` に敵味方の持ち歩き上限3体を明記。
- `package.json` と `package-lock.json` のバージョンを `1.17.1` から `1.18.0` に更新。

### Fixed
- パーティ上限に関する判定・表示・説明文が6体基準で分散していた不整合を解消。

### Prompt
- User: `モンスターは敵味方ともに3体まで持ち歩けるようにしてください`
- Assistant（対応方針）: 上限定数を3に統一し、捕獲/ボックス/加入処理・UI文言・実績・仕様書・版数を最小差分で同期する。

## [1.17.1] - 2026-03-02

### Note
- コード構造・保守性（Dカテゴリ）から、重み抽選ロジックの重複を解消し、抽選仕様の一貫性を高めた。

### Added
- `js/data/weightedRandom.ts` を追加し、汎用の重み抽選ユーティリティ `pickByWeight()` を実装。
- `tests/weightedRandom.test.ts` を追加し、重み比率・ゼロ重み・不正乱数入力の挙動を検証する単体テストを実装。

### Changed
- `js/data/monsters.ts` の特性抽選を共通 `pickByWeight()` 利用へ変更し、ローカル重み抽選実装を削除。
- `js/data/wildEncounters.ts` の野生出現抽選を共通 `pickByWeight()` 利用へ変更し、ローカル重み抽選実装を削除。
- `js/data/mapRules.ts` の天候抽選を共通 `pickByWeight()` 利用へ変更。
- `TODO.md` から D-07 を削除し、Dカテゴリ/総件数サマリーを更新。
- `package.json` と `package-lock.json` のバージョンを `1.17.0` から `1.17.1` に更新。

### Fixed
- データ抽選ロジックが複数ファイルで重複管理され、将来的な仕様差分が発生しやすい状態を改善。

### Prompt
- User: `簡単にやれるものから順次作業していってください`
- Assistant（対応方針）: TODOのDカテゴリから D-07 を最小差分で先行対応し、共通化・テスト・検証・TODO/版数/履歴を同期する。

## [1.17.0] - 2026-03-02

### Note
- 未実装・機能不足（Cカテゴリ）から、ゲーム内参照性に直結する2項目（タイプ相性表参照 / ポストゲーム導線明示）をメニュー内で実装した。

### Added
- `js/scenes/menu/menuConstants.ts` のガイドページに「タイプ相性表①」「タイプ相性表②」を追加し、タイプ有利不利と複合タイプの倍率乗算例をゲーム内で参照可能にした。
- `js/scenes/menu/views/questView.ts` に「── ポストゲーム目標 ──」セクションを追加し、`花園伝説 / 四天王制覇 / 最終ライバル勝利` の短期目標を表示するようにした。

### Changed
- `js/scenes/menu/menuConstants.ts` の「メニュー機能」ガイド文言へ、ガイドからタイプ相性表を参照できる旨を追記。
- `js/scenes/menu/views/questView.ts` に四天王制覇判定（`eliteFourWind/Flame/Tide/Frost`）を集約する補助関数を追加し、ポストゲーム目標の解放条件に反映。
- `GAME_DESIGN.md` の 9.2/9.3 を更新し、ガイドのタイプ相性表掲載とクエストのポストゲーム目標表示仕様を明文化。
- `TODO.md` から C-06 / C-09 を削除し、Cカテゴリおよび総件数サマリーを更新。
- `package.json` と `package-lock.json` のバージョンを `1.16.5` から `1.17.0` に更新。

### Fixed
- タイプ相性の確認がゲーム外前提になっていた導線不足を改善。
- 四天王到達後の短期目標がメニュー上で把握しづらい問題を改善。

### Prompt
- User: `未実装・機能不足のタスクを何個か作業してください`
- Assistant（対応方針）: TODOのCカテゴリから `C-06` と `C-09` を最小差分で実装し、コード・設計書・TODO・版数・変更履歴を同期する。

## [1.16.5] - 2026-03-02

### Note
- UX・操作性改善（Fカテゴリ）のうち、ショップ売却画面の情報不足を解消し、売却判断に必要な説明と残数見込みを同一画面で確認できるようにした。

### Added
- `js/scenes/world/worldShop.ts` の売却モードに、選択中アイテムの説明文表示を追加。
- `js/scenes/world/worldShop.ts` の売却モードに、1個売却時の「売却後所持数」即時表示を追加。

### Changed
- `js/scenes/world/worldShop.ts` の売却完了メッセージへ、売却後の残数（`のこりN個`）を追加。
- `GAME_DESIGN.md` のショップ仕様へ、売却画面の説明文/売却後所持数の即時表示を追記。
- `TODO.md` から F-01 を削除し、Fカテゴリ件数を `14件` から `13件`、総件数を `81件` から `80件` に更新。
- `package.json` と `package-lock.json` のバージョンを `1.16.4` から `1.16.5` に更新。

### Fixed
- ショップ売却画面で、アイテム説明と売却後所持数を即時確認できず、売却判断に必要な情報が不足していた問題を改善。

### Prompt
- User: `UX・操作性改善をやってください`
- Assistant（対応方針）: TODOのFカテゴリから F-01 を最小差分で実装し、コード・設計書・TODO・版数・変更履歴を同期する。

## [1.16.4] - 2026-03-02

### Note
- テスト強化タスク（Eカテゴリ）のうち、ダメージ計算・捕獲率計算・進化判定の単体テストを追加し、捕獲率仕様を実装と設計書で同期。

### Added
- `tests/battleCalcStatus.test.ts` を追加し、ダメージ計算の `クリティカル / 天候 / STAB / 状態異常（やけど減衰）` を検証する単体テストを実装。
- `tests/battleCatch.test.ts` を追加し、捕獲率計算の `HP補正 / ボール補正 / 状態異常補正 / 確定捕獲` を検証する単体テストを実装。
- `tests/evolution.test.ts` を追加し、進化判定の `LEVEL / ITEM` 条件を検証する単体テストを実装。

### Changed
- `js/scenes/battle/battleCatch.ts` に `calculateCatchRate()` を追加し、捕獲率計算を純粋関数化。
- `js/scenes/battle/battleCatch.ts` の捕獲計算へ状態異常補正（`SLEEP/FREEZE`, `PARALYSIS/BURN/POISON`）を追加。
- `GAME_DESIGN.md` に「6.7 捕獲率補正」を追記し、捕獲率の乗算要素と上限/確定捕獲条件を明文化。
- `TODO.md` から E-01 / E-02 / E-03 を削除し、Eカテゴリ件数と総件数を更新。
- `package.json` と `package-lock.json` のバージョンを `1.16.3` から `1.16.4` に更新。

### Fixed
- 捕獲率計算で状態異常補正が反映されない不一致を修正。
- ダメージ計算・捕獲率計算・進化判定の回帰テスト不足を解消。

### Prompt
- User: `テスト強化の課題を解消して`
- Assistant（対応方針）: E-01〜E-03を最小差分で実装し、必要な実装修正（捕獲率の状態異常補正）と設計書/TODO/版数/履歴を同期する。

## [1.16.3] - 2026-03-02

### Note
- データ・型定義の乖離（Bカテゴリ）を優先解消し、型定義・データ検証・BGMルーティング・設計書・TODOを実装基準へ同期。

### Added
- `js/data/mapRules.ts` に `AREA_THEME` / `getAreaTheme()` を追加し、マップテーマ解決を共通化。
- `tests/dataValidation.test.ts` に新規プール検証（`swampPoolIds`）の回帰テストを追加。

### Changed
- `types/game.d.ts` を更新し、`Move.category` / `selfHealPercent` / `MonsterSpecies.learnset` / `MapKey` / `TileCode` / `NpcDef` を現行実装へ同期。
- `types/game.d.ts` のモンスター特性定義を旧 `abilityId/abilityRates` から現行 `ability` 配列仕様へ更新。
- `js/data/dataValidation.ts` のモンスタープール検証対象に `swamp/coral/sandValley/shadowGrove/library/basin` を追加。
- `js/audio/areaBgm.ts` のエリアBGM解決を `mapRules` の共通テーマ参照に変更し、マップテーマの二重管理を解消。
- `GAME_DESIGN.md` の基本操作表を `Z / Enter / Space` に同期。
- `TODO.md` の B-01〜B-10 を対応済みへ更新し、統計サマリー件数を更新。
- `package.json` と `package-lock.json` のバージョンを `1.16.2` から `1.16.3` に更新。

### Fixed
- 型定義が実データと一致しないことによる参照ミス・保守負荷の増大を改善。
- `dataValidation` が新規6プールを検証対象外にしていた不整合を修正。
- エリアBGM解決仕様が `audio` と `mapRules` に分散していた状態を是正し、整合崩れリスクを低減。

### Prompt
- User: `データ・型定義の乖離の課題を解消して`
- Assistant（対応方針）: TODOのBカテゴリ（B-01〜B-10）を最小差分で一括修正し、コード・テスト・設計書・TODO・版数・履歴を同期する。

## [1.16.2] - 2026-03-02

### Note
- 重大バグ・進行リスク（Aカテゴリ）を優先修正し、進行フラグ、入力安定性、音声初期化、保存整合性の破綻要因を解消。

### Added
- `js/audio/areaBgm.ts` を追加し、マップキーからエリアBGMを解決する共通関数 `resolveAreaBgmKey` を実装。
- `js/scenes/world/worldInputGuards.ts` を追加し、`dialog/choice/battlePending` を含む入力ロック判定を共通化。
- `tests/areaBgm.test.ts` と `tests/worldInputGuards.test.ts` を追加し、BGMルーティングと入力ロックの回帰テストを整備。

### Changed
- `js/scenes/WorldScene.ts` のバトル結果処理を拡張し、トレーナー戦とストーリー戦（花園伝説）を復帰時に統一処理するよう変更。
- `js/audio/AudioManager.ts` の初期化フローを見直し、非同期初期化完了後に有効化する構成へ変更（初回BGM/決定SEのキュー再生対応）。
- `js/data/achievements.ts` の `WIN_STREAK_5/10` を累計戦闘数判定から連続勝利数判定へ変更。
- `js/state/gameState.ts` / `js/state/saveSchema.ts` / `js/scenes/world/worldTrainerArena.ts` を更新し、闘技場ラウンド状態を正式セーブ対象 `arenaRound` として永続化。
- `js/scenes/menu/views/bagView.ts` のバッグ対象選択表示をニックネーム優先（`getMonsterDisplayName`）へ統一。
- `js/scenes/menu/views/settingsView.ts` の設定入力処理を `removeAllListeners("down")` 依存から、ハンドラ参照による安全な `off/on` 管理へ変更。
- `GAME_DESIGN.md` にBGM解決仕様・連勝実績判定・伝説フラグ更新タイミング（勝利時のみ）を追記。
- `package.json` と `package-lock.json` のバージョンを `1.16.1` から `1.16.2` に更新。

### Fixed
- 伝説イベントで `legendaryDefeated` がバトル前に立ち、敗北/逃走時に再挑戦不可になる問題を修正。
- `AudioManager.init()` の非同期競合で初回BGM/SEが取りこぼされる問題を修正。
- `playAreaBgm()` の旧マップキー依存により現行マップで不正なBGMになる問題を修正。
- `settingsView.ts` の過剰なリスナー解除で他入力処理を巻き込むリスクを低減。
- 連勝実績が命名と異なり累計戦闘数で解除される不一致を修正。
- 闘技場ラウンドが正式セーブ対象外で復帰整合が崩れる問題を修正。
- 入力ロック仕様の回帰テスト欠如を補い、再発検知を追加。
- バッグ対象選択の表示名がニックネームと不一致になる問題を修正。

### Prompt
- User: `重大バグ・進行リスクのTODOを解消してください`
- Assistant（対応方針）: A-01〜A-10を最小差分で同時修正し、進行フラグ更新タイミング・入力リスナー管理・保存整合・音声初期化を中心にコード/テスト/設計書/版数/履歴を同期する。

## [1.16.1] - 2026-03-02

### Note
- 入力の取りこぼしを中心に微調整を行い、キー操作の一貫性とタッチ端末での進行安定性を向上。

### Added
- `js/scenes/WorldScene.ts` に、スターター選択UI向けのタッチ入力処理（上下/決定/キャンセル）を追加。

### Changed
- `js/scenes/WorldScene.ts` のフィールド会話・調査アクションの決定キーへ `Space` を追加し、標準決定キー仕様（`Z / Enter / Space`）へ統一。
- `js/scenes/WorldScene.ts` の会話シーケンス進行キーを `Z/Enter` から `Z/Enter/Space` へ拡張。
- `package.json` と `package-lock.json` のバージョンを `1.16.0` から `1.16.1` に更新。

### Fixed
- タッチ操作時に会話送りが進められず進行しづらい問題を改善。
- タッチ操作時にスターター選択の決定・キャンセル・上下選択ができない問題を解消。

### Prompt
- User: `細かな調整を様々行ってクオリティの底上げをしてください`
- Assistant（対応方針）: 入力仕様の一貫性とタッチ端末での操作完結性を優先し、`WorldScene` に限定した最小差分で実害のある取りこぼしを修正する。

## [1.16.0] - 2026-03-02

### Note
- タイトル・フィールド・バトルの視覚レイヤーを強化し、既存UI可読性を維持したまま画面全体の奥行きと没入感を向上。

### Added
- `js/scenes/title/titleVisuals.ts` に星の瞬きレイヤーと前景ミスト演出を追加。
- `js/scenes/WorldScene.ts` の `createFieldAtmosphere()` に微細光粒アニメーションと画面端ビネットを追加。
- `js/scenes/battle/battleVisuals.ts` に環境フォグ、微細スパーク、床面シマー演出を追加。

### Changed
- `GAME_DESIGN.md` の演出仕様（10.2 グラフィックエフェクト）に、タイトル/フィールド/バトルの新しい視覚演出方針を追記。
- `package.json` と `package-lock.json` のバージョンを `1.15.0` から `1.16.0` に更新。

### Fixed
- 画面全体がフラットに見えやすく、長時間プレイ時にシーンごとの視覚的変化が弱い問題を改善。

### Prompt
- User: `グラフィックを強化してください`
- Assistant（対応方針）: 既存の描画構成と操作性を維持しつつ、タイトル・ワールド・バトルへ低負荷なレイヤー演出を最小差分で追加し、仕様書・版数・変更履歴を同期する。

## [1.15.0] - 2026-03-02

### Note
- BGM遷移とSE質感を強化し、長時間プレイ時の聴感疲労を抑えつつ没入感を向上。

### Added
- `js/audio/AudioManager.ts` にBGMトーン補正用フィルタプリセット（エリア別）と最終段コンプレッサを追加。

### Changed
- `js/audio/AudioManager.ts` のBGM切替を即時停止からフェード遷移（フェードアウト→再生開始時フェードイン）へ変更。
- `js/audio/AudioManager.ts` のカーソル音/歩行音に微ランダム（音程・強さ）を導入し、反復時の単調感を軽減。
- `GAME_DESIGN.md` のオーディオ仕様へ、BGM遷移・エフェクトチェイン・反復SE微変化の仕様を追記。
- `package.json` と `package-lock.json` のバージョンを `1.14.0` から `1.15.0` に更新。

### Fixed
- マップ遷移や戦闘遷移でBGMが唐突に切り替わり、音のつながりが不自然になる問題を緩和。
- カーソル移動/歩行の連続操作でSEが機械的に聴こえやすい問題を改善。

### Prompt
- User: `オーディオを強化してください`
- Assistant（対応方針）: 既存のTone.jsベース構成を維持しつつ、BGM遷移品質・ミックス安定性・反復SEの聴感品質を最小差分で向上し、仕様書・版数・検証結果を同期する。

## [1.14.0] - 2026-03-02

### Note
- 地域サブクエストに連鎖解放と全達成記念報酬を導入し、段階的な達成感を強化。

### Added
- `js/scenes/WorldScene.ts` に地域連鎖4依頼（湿地→珊瑚→図書館→星降り）を全完了した際の記念報酬処理 `_grantRegionalQuestChainBonusIfReady()` を追加。
- `js/state/storyFlags.ts` に連鎖達成記念報酬の受取状態 `regionalQuestChainBonusClaimed` を追加。

### Changed
- `js/scenes/WorldScene.ts` の地域サブクエスト会話分岐を更新し、`珊瑚の記録復元` / `図書館文献復元` / `星降り観測最終報告` を前段クリアで解放する連鎖仕様へ変更。
- `js/scenes/menu/views/questView.ts` を更新し、地域連鎖サブクエストの未解放状態を `🔒 未解放` で表示し、記念報酬進捗を一覧に追加。
- `GAME_DESIGN.md` に地域連鎖解放順と記念報酬、クエスト画面の未解放表示仕様を追記。
- `package.json` と `package-lock.json` のバージョンを `1.13.0` から `1.14.0` に更新。

### Fixed
- 地域サブクエストが独立しすぎて進行導線が分散し、達成の手応えが薄くなる問題を連鎖解放で改善。

### Prompt
- User: `このゲームを更に面白くする要素を検討してください
実装前に私に確認を取ってください`
- User: `実装してOK`
- Assistant（対応方針）: 小規模MVPとして地域サブクエストを連鎖解放化し、既存導線を維持しながら全達成時の記念報酬とクエスト画面の未解放可視化を最小差分で追加する。

## [1.13.0] - 2026-03-02

### Note
- メニュー構成を再編し、クエスト進捗を独立画面で確認できる導線へ更新。

### Added
- `js/scenes/menu/views/questView.ts` を追加し、ストーリークエスト/サブクエストの進捗一覧（進行中/完了）と達成数サマリーを表示するビューを実装。
- メニューに `クエスト` 項目（`action: "quest"`）を追加。

### Changed
- `js/scenes/menu/views/trainerView.ts` から日替わりチャレンジ表示とクエスト進捗表示を削除し、トレーナー情報を戦績・図鑑・闘技場記録中心に整理。
- `js/scenes/menu/menuViews.ts` と `js/scenes/MenuScene.ts` を更新し、`quest` サブメニュー遷移と描画ディスパッチを追加。
- `js/scenes/menu/menuConstants.ts` から `とじる` 項目を削除し、ガイド文言のメニュー機能説明を新構成へ更新。
- `GAME_DESIGN.md` にメニュー項目仕様（クエスト新設、トレーナー表示範囲、閉じる項目削除）を追記。
- `package.json` と `package-lock.json` のバージョンを `1.12.0` から `1.13.0` に更新。

### Fixed
- トレーナー画面に日替わりチャレンジとクエスト進捗が混在していた責務不一致を解消。
- クエスト進捗確認の導線が分散していた問題を、専用メニュー項目で一元化。

### Prompt
- User: `・メニューの「トレーナー」の項目から日替わりチャレンジとクエストを削除してください
・メニューに「クエスト」の項目を新規追加して、ストーリークエストやサブクエストの進捗を確認できるようにしてください（ソーシャルゲームのような機能）
・メニューから閉じるを削除してください`
- Assistant（対応方針）: メニュー項目を最小差分で再編し、トレーナー情報の責務整理・クエスト専用ビュー新設・閉じる項目削除を同時実施。仕様書、版数、変更履歴を同期する。

## [1.12.0] - 2026-03-02

### Note
- ゲーム内キーボードを機能拡張し、タイトルとメニューで同一モジュールを共有する構成へ統一。

### Added
- `js/ui/gameKeyboard.ts` を追加し、共通キー配列（拡張ひらがな）・カーソル移動・入力確定/削除/全削除ロジックを実装。
- ゲーム内キーボードに `ぜんけし`（全削除）機能を追加。

### Changed
- `js/scenes/title/titleNameInput.ts` を共通キーボード参照に変更し、主人公名入力で `ら行/わ/を` を含む文字セットを利用するよう更新。
- `js/scenes/menu/menuSceneNickname.ts` を共通キーボード参照に変更し、ニックネーム入力UIのキー配列・移動処理・入力処理を統一。
- `js/scenes/MenuScene.ts` のキーボード列数初期値を共通定義参照へ変更。
- `GAME_DESIGN.md` のニックネーム仕様へ共通キーボード利用と機能キー仕様を追記。
- `package.json` と `package-lock.json` のバージョンを `1.11.1` から `1.12.0` に更新。

### Fixed
- タイトル名入力とメニューのニックネーム入力で使える文字・操作仕様が分かれていた不一致を解消。
- 既存キーボードで不足していた `ら行/わ/を` の入力不可問題を解消。

### Prompt
- User: `・ゲーム内キーボードに機能が足りてないので追加開発してください
・モジュール化してタイトルとメニューで同じものを利用するようにしてください`
- Assistant（対応方針）: 共通キーボードモジュールを新設し、Title/Menu 双方の重複ロジックを置換。文字セット拡張と全削除機能を最小差分で追加して仕様・版数・履歴を同期する。

## [1.11.1] - 2026-03-02

### Note
- フィールド/ショップ/メニューのUI基準を揃え、文字可読性・余白・配置一貫性を商用品質に近づける調整を実施。

### Added
- `js/ui/UIHelper.ts` に共通レイアウトトークン `UI_LAYOUT` と文字サイズトークン `UI_FONT_SIZE` を追加。

### Changed
- `js/scenes/WorldScene.ts` の会話本文ウィンドウ・話者名ウィンドウ・時刻天候ウィンドウを共通マージン基準で再配置し、本文フォントを拡大。
- `js/scenes/world/worldShop.ts` のショップウィンドウを共通ギャップ基準で再配置し、行間/選択領域/文字サイズを拡大。
- `js/scenes/world/worldShop.ts` の所持金表示を画面右側固定からショップウィンドウ内右上固定へ変更。
- `js/scenes/menu/menuViewsShared.ts` と `js/scenes/menu/menuViews.ts` のメインメニュー幅・外周余白・行高を調整し、視認性を改善。
- `GAME_DESIGN.md` にフィールドUI配置ルール（セーフマージン/文字サイズ/ショップ表示位置）を追記。
- `package.json` と `package-lock.json` のバージョンを `1.11.0` から `1.11.1` に更新。

### Fixed
- ショップ表示中に所持金ラベルがウィンドウ外へ見えるため、配置が散らかって見える問題を解消。
- 会話/天候UIが画面端に寄りすぎて圧迫感が出る問題を緩和。

### Prompt
- User: `UIの文字が小さかったり、余白が広すぎ（ウィンドウの枠に近い）だったり、ウィンドウを表示する位置がバラバラで統一感なくて安っぽいです。商業レベルまでクオリティを向上させてください`
- Assistant（対応方針）: 共通UIトークンを導入し、World常設UI・ショップUI・メインメニューを同一レイアウト基準へ寄せることで、最小差分で可読性と統一感を引き上げる。

## [1.11.0] - 2026-03-02

### Note
- 探索ポイントと地域サブクエストを大幅拡張し、フィールド周回と報告導線の遊び応えを強化。

### Added
- `js/scenes/WorldScene.ts` に未実装だった各地のロアイベント（湿地/珊瑚/砂漠/影/図書館/盆地）を追加。
- `js/scenes/WorldScene.ts` に地域サブクエスト4本（湿地調合・珊瑚記録・図書館復元・星降り観測）を追加。
- `js/scenes/world/worldMapData.ts` の `FIELD_HIDDEN_ITEMS` に7件の新規隠し探索ポイントを追加。

### Changed
- `js/scenes/WorldScene.ts` のNPC会話分岐を拡張し、`WATER_TRIO` クエストと新規 `story` イベントID群を処理するよう更新。
- `js/scenes/world/worldMapData.ts` で依頼NPCを `MISTY_SWAMP` / `CORAL_REEF` / `ANCIENT_LIBRARY` / `STARFALL_BASIN` に追加。
- `js/state/storyFlags.ts` に探索進捗・サブクエスト進捗フラグを追加し、セーブ互換を維持したまま進行状態を保持できるよう更新。
- `GAME_DESIGN.md` に探索拡張と地域サブクエスト仕様（条件/報酬カテゴリ）を追記。
- `package.json` と `package-lock.json` のバージョンを `1.10.2` から `1.11.0` に更新。

### Fixed
- `CORAL_REEF` に存在していた `WATER_TRIO` クエスト導線が会話処理未実装で進行できない問題を解消。
- 複数マップに配置済みだった `story` イベントIDの一部が未実装で実質無反応になる問題を解消。

### Prompt
- User: `探索要素やサブクエストを大幅に追加して`
- Assistant（対応方針）: 既存マップ導線を維持したまま、隠し探索ポイント増設・地域依頼NPC追加・未実装イベント補完を組み合わせて大規模拡張し、仕様書と版数を同期する。

## [1.10.2] - 2026-03-02

### Note
- 全体フォントとパネル質感を見直し、UIの高級感と統一感を向上。

### Added
- なし

### Changed
- `js/ui/UIHelper.ts` のフォント定義を刷新し、`TITLE` を明朝系・`UI` を視認性の高い和文サンセリフ系へ更新。
- `js/ui/UIHelper.ts` のパネル配色・影・ハイライト処理を調整し、立体感と落ち着いたコントラストを強化。
- `js/ui/TouchControls.ts` のアクションボタン文字フォントを共通 `FONT.UI` 参照に統一。
- `js/scenes/title/titleVisuals.ts` のフッターテキストフォントを共通 `FONT.UI` に統一。
- `index.html` のWebフォント読み込みを `Noto Sans JP` / `Noto Serif JP` に変更し、ベースフォントとフレーム陰影を上質トーンへ調整。
- `package.json` と `package-lock.json` のバージョンを `1.10.1` から `1.10.2` に更新。

### Fixed
- UI/フォントが軽く見えやすかった表示印象を改善し、全画面での視覚トーンを統一。

### Prompt
- User: `UIやフォントが安っぽいので高級感を増やしてクオリティを向上させてください`
- Assistant（対応方針）: フォント定義と共通UI描画ヘルパーを主軸に最小差分で質感を改善し、関連箇所のハードコードフォントを共通トークンへ寄せる。

## [1.10.1] - 2026-03-02

### Note
- プロローグシーンの入力リスナー管理を見直し、シーン再入時の多重入力リスクを低減。

### Added
- なし

### Changed
- `js/scenes/PrologueScene.ts` を変更し、`keydown` リスナーをハンドラ参照で登録・解除する構成へ変更。
- `js/scenes/PrologueScene.ts` にシーン `shutdown` 時の入力リスナークリーンアップ処理を追加。
- `package.json` と `package-lock.json` のバージョンを `1.10.0` から `1.10.1` に更新。

### Fixed
- タイトル→新規開始→タイトル→新規開始のようにプロローグへ再入した際、入力リスナーが積み上がって同一キー入力が重複処理される可能性を解消。

### Prompt
- User: `このプロジェクトをブラッシュアップしてください`
- Assistant（対応方針）: 既存仕様を維持したまま品質改善箇所を調査し、再入時の入力イベント多重登録リスクを最小差分で修正。検証コマンドを順次実行し、バージョンと変更履歴を同期する。

## [1.10.0] - 2026-03-02

### Note
- タイトル設定の表示崩れ、パーティ画面の可読性、エモスキップ挙動、初期明るさ、野生連勝機能の撤去を一括で調整。

### Added
- なし

### Changed
- `js/scenes/BattleScene.ts` と `js/scenes/battle/battleEmoSkip.ts` を変更し、エモスキップON時は条件成立バトルで長押し不要の自動スキップに変更。
- `js/scenes/menu/views/partyView.ts` を変更し、選択中モンスターの詳細（能力値・EXP・わざPP）を専用詳細パネルへ表示する構成に変更。
- `js/state/saveSchema.ts` と `js/scenes/menu/settingsShared.ts` を変更し、画面明るさの既定値を `115%` に調整。
- `js/data/achievements.ts` を変更し、削除した野生連勝機能に依存しない達成条件へ更新。
- `js/scenes/WorldScene.ts` / `js/scenes/battle/battleResultRewards.ts` / `js/scenes/battle/battleCatch.ts` / `js/state/gameState.ts` を変更し、やせいれんしょう関連ロジックを撤去。
- `js/scenes/title/titleSettings.ts` を変更し、画面高さに応じた行間・文字サイズで設定項目を描画するよう調整。
- `GAME_DESIGN.md` を更新（エモスキップ仕様、実績例、パーティ詳細表示）。
- `package.json` と `package-lock.json` のバージョンを `1.9.14` から `1.10.0` に更新。

### Fixed
- タイトル画面の設定項目で文字が重なって読みにくくなる不具合を解消。
- パーティ画面に表示されていた「🧪 えもじレシピ」表示を削除。

### Prompt
- User: `・タイトル画面の設定が文字が重なって表示されています
・エモスキップONの場合はプレイヤーの長押し無しで自動的にスキップするようにしてください
・パーティー画面でモンスターのステータス等が小さくて読めないので詳細画面に表示するようにしてください
・パーティー画面に絵文字レシピという謎の文字列が表示されています
・デフォルトの明るさが暗いです
・やせいれんしょうの機能を削除してください`
- Assistant（対応方針）: 6要望に対して最小差分でUI/バトル/状態管理を横断修正し、仕様書・バージョン・検証コマンド結果まで同期する。

## [1.9.14] - 2026-03-02

### Note
- バトル中エモスキップ長押しの決定キー判定を共通仕様に合わせ、`Space` でも発動するよう修正。

### Added
- なし

### Changed
- `js/scenes/BattleScene.ts` のエモスキップ長押し判定に `SPACE` キーを追加。
- `package.json` のバージョンを `1.9.13` から `1.9.14` に更新。
- `package-lock.json` のバージョン表記を `1.9.14` に更新。

### Fixed
- エモスキップが `Z/Enter` 長押しでしか発動せず、標準決定キーである `Space` 長押しでは発動しない不具合を解消。

### Prompt
- User: `バグを探して修正してください`
- Assistant（対応方針）: 入力仕様の不整合を調査し、`BattleScene` のエモスキップ長押し判定へ `Space` を追加する最小差分修正を実施。`lint/typecheck/test/build` を順次実行して回帰確認。

## [1.9.13] - 2026-03-02

### Note
- `WorldScene` のトレーナー/闘技場責務を分割して1ファイル肥大化を解消し、作業規約に検証コマンド逐次実行ルールを明文化。

### Added
- `js/scenes/world/worldTrainerArena.ts` を追加（トレーナー戦開始・対戦相手生成・勝敗後進行・闘技場進行を集約）。

### Changed
- `js/scenes/WorldScene.ts` のトレーナー戦/闘技場関連処理を委譲構成へ変更し、シーン本体の責務を縮小。
- `AGENTS.md` の作業フローに、`lint/typecheck/test/build` を前コマンド完了確認後に逐次実行するルールを追加。
- `package.json` のバージョンを `1.9.12` から `1.9.13` に更新。
- `package-lock.json` のバージョン表記を `1.9.13` に更新。

### Fixed
- なし（挙動変更なしのリファクタリングと作業規約更新）。

### Prompt
- User: `WorldScene.tsをリファクタリング・分割することで1ファイルのサイズを減らしてください。必要なら外部ライブラリ等も活用してください。`
- User: ``npm run lint` / `npm run typecheck` / `npm run test` / `npm run build`は時間がかかるので前のコマンドの完了を待ってから次のコマンドを実行してください。Agent.mdにそのルールを追記してください`
- User: `6. コードの変更がある場合のみ、セマンティックバージョニングの原則に従い、変更の種類に応じて適切なバージョン番号を更新する。`
- User: `7. コードの変更がある場合のみ、AIとのチャット完了後に `CHANGELOG.md` を更新する。`
- Assistant（対応方針）: `WorldScene` の長大ロジックを `js/scenes/world/` に分離して委譲化し、検証ルールを `AGENTS.md` に追記。規約に従ってバージョン更新と `CHANGELOG.md` 追記を実施する。

## [1.9.12] - 2026-03-02

### Note
- `MenuScene` の責務分割で1ファイル肥大化を解消し、あわせて既知の `no-undef` Lintエラーをファイル単位設定で吸収。

### Added
- `js/scenes/menu/menuSceneInput.ts` を追加（上下長押しリピート入力の共通ロジック）。
- `js/scenes/menu/menuSceneNickname.ts` を追加（ニックネーム入力UI/操作ロジック）。
- `js/scenes/menu/menuSceneSettings.ts` を追加（設定操作・セーブ削除・中央メッセージ）。

### Changed
- `js/scenes/MenuScene.ts` を委譲中心に再構成し、入力/設定/ニックネーム処理を `js/scenes/menu/` 配下へ分離。
- `eslint.config.js` にファイル単位の globals 設定を追加し、`js/scenes/title/titleVisuals.ts` の `__APP_VERSION__` と `vite.config.ts` の `process` を `no-undef` 対象外として扱うよう調整。
- `package.json` のバージョンを `1.9.11` から `1.9.12` に更新。
- `package-lock.json` のバージョン表記を `1.9.12` に更新。

### Fixed
- `eslint .` 実行時に発生していた既知の `no-undef` 3件（`__APP_VERSION__`, `process`×2）を解消。

### Prompt
- User: `MenuScene.tsをリファクタリング・分割することで1ファイルのサイズを減らしてください。必要なら外部ライブラリ等も活用してください。`
- User: `以下のLintエラーは無視するように設定してください`
- Assistant（対応方針）: `MenuScene.ts` を責務単位で `js/scenes/menu/` に分離し、既知Lintはファイル単位のglobals定義で最小差分対応。`typecheck/test/build` で回帰確認する。

## [1.9.11] - 2026-03-02

### Note
- 戦闘開始時に発生していた `pickByWeight is not defined` を修正し、エンカウントからバトル遷移できる状態に復旧。

### Added
- なし

### Changed
- `js/data/monsters.ts` に特性抽選用の重み付き選択ヘルパー `pickByWeight()` を追加。
- `package.json` のバージョンを `1.9.10` から `1.9.11` に更新。
- `package-lock.json` のバージョン表記を `1.9.11` に更新。

### Fixed
- `rollMonsterAbilityId()` 内で未定義関数 `pickByWeight` を参照していたため、戦闘突入時に `ReferenceError` で停止する不具合を解消。

### Prompt
- User: `戦闘に入るとエラーが発生します index-DkMqmoDY.js:1 Uncaught ReferenceError: pickByWeight is not defined`
- Assistant（対応方針）: `pickByWeight` の参照元を特定し、`rollMonsterAbilityId()` が同一モジュール内の定義済みヘルパーを使うよう最小差分で修正。`lint/typecheck/test/build` の順で検証する。

## [1.9.10] - 2026-03-02

### Note
- `TitleScene` の責務を分割し、1ファイル肥大化を解消して保守性を向上。

### Added
- `js/scenes/title/titleVisuals.ts` を追加（タイトル背景・ロゴ・メニュー描画）。
- `js/scenes/title/titleNameInput.ts` を追加（新規ゲーム名入力UI）。
- `js/scenes/title/titleSettings.ts` を追加（設定パネル操作）。
- `js/scenes/title/titleHelp.ts` を追加（ヘルプパネル表示）。

### Changed
- `js/scenes/TitleScene.ts` を委譲中心の薄いオーケストレーション構成へ変更。
- `package.json` のバージョンを `1.9.9` から `1.9.10` に更新。

### Fixed
- なし（挙動変更なしのリファクタリング）。

### Prompt
- User: `TitleScene.tsをリファクタリング・分割することで1ファイルのサイズを減らしてください。必要なら外部ライブラリ等も活用してください。`
- Assistant（対応方針）: `TitleScene.ts` を責務単位で分離し、既存挙動を維持したまま描画・名前入力・設定・ヘルプをモジュール化。`lint/typecheck/test/build` で回帰確認する。

## [1.9.8] - 2026-03-02

### Note
- `vite build` 失敗の原因だった `MAX_MOVE_SLOTS` import 不整合を修正。

### Added
- なし

### Changed
- `js/scenes/battle/battleLearnMove.ts` の `MAX_MOVE_SLOTS` 参照先を `js/data/monsters.ts` に変更。
- `js/scenes/battle/battleResultRewards.ts` の `MAX_MOVE_SLOTS` 参照先を `js/data/monsters.ts` に変更。
- `package.json` のバージョンを `1.9.7` から `1.9.8` に更新。

### Fixed
- `js/scenes/battle/battleConstants.ts` から未 export の `MAX_MOVE_SLOTS` を import していたことによる本番ビルド失敗を解消。

### Prompt
- User: `vite build` で `MAX_MOVE_SLOTS is not exported by battleConstants.ts` エラーが発生
- Assistant（対応方針）: 参照元を調査し、`MAX_MOVE_SLOTS` の import を定義元 (`js/data/monsters.ts`) に統一して最小差分で修正。検証後にバージョンと `CHANGELOG.md` を更新。

## [1.9.7] - 2026-03-02

### Note
- リファクタリング後の最終検証と仕上げを実施。

### Added
- なし

### Changed
- `package.json` のバージョンを `1.9.6` から `1.9.7` に更新。

### Fixed
- `js/data/monsters.ts` の `fusionRecipes` 重複宣言を修正。
- 一時スクリプト `refactor_battle.mjs` を削除。

### Prompt
- User: 前セッションからの継続: BattleScene.ts分割完了後の最終検証と仕上げ
- Assistant（対応方針）: テスト結果確認 → 既存バグ修正 → 一時ファイル削除 → バージョン更新 → 全検証再実行

## [1.9.6] - 2026-03-01

### Note
- `TitleScene` の重複入力バインド処理を整理し、保守性を改善。

### Added
- なし

### Changed
- `js/scenes/TitleScene.ts` でキー登録/解除の重複処理を共通メソッド化。
- `package.json` のバージョンを `1.9.5` から `1.9.6` に更新。

### Fixed
- なし（挙動変更なしのリファクタリング）。

### Prompt
- User: コードをリファクタリングしてください。必要なら外部ライブラリ等も活用してください。
- Assistant（対応方針）: 影響範囲を確認し、最小差分で安全なリファクタリング箇所を選定する。`lint/typecheck/test` を実行して回帰を確認する。

## [1.9.5] - 2026-03-01

### Note
- 追加した入力共通ルールへの準拠状況を横断調査して修正。

### Added
- `js/ui/inputConstants.ts` を新規作成し、長押しリピートしきい値定数を共通化。

### Changed
- `js/scenes/TitleScene.ts` の決定/キャンセル入力を `Z/Enter/Space`・`X/ESC` に統一。
- `js/scenes/BattleScene.ts` に `ESC` キャンセル対応を追加。
- `js/scenes/battle/battleMessageFlow.ts` の早送り長押し判定に `Enter` を追加。
- `js/scenes/PrologueScene.ts` に `X/ESC` スキップとガイド文言更新を反映。
- `js/scenes/world/worldShop.ts` に `X/ESC` と上下長押しリピート移動を追加。
- `js/scenes/MenuScene.ts` の長押ししきい値を共通定数参照へ置換。
- `package.json` のバージョンを `1.9.4` から `1.9.5` に更新。

### Fixed
- 入力競合の温床となるシーンごとの差異を是正し、入力仕様の不一致を解消。

### Prompt
- User: 今回追加したルールに従っていないところがないか調査し、あれば修正してください
- Assistant（対応方針）: 全シーン入力実装を横断調査し、違反候補（決定/キャンセル片対応、入力ロック漏れ、長押し未対応）を抽出。最小差分で修正し、`lint/typecheck/test` で検証する。

## [1.9.4] - 2026-03-01

### Note
- バトル状態遷移を `xstate` で明示化し、状態更新経路を一元化。

### Added
- 依存として `xstate` を追加。
- `js/scenes/battle/battleStateMachine.ts` を新規追加。
- `tests/battleStateMachine.test.ts` を新規追加。

### Changed
- `js/scenes/BattleScene.ts` の状態更新を `setBattleState()` 経由へ統一。
- `js/scenes/battle/battleMenu.ts` の状態変更を `setSceneBattleState()` 優先へ変更。
- `package.json` / `package-lock.json` を `1.9.4` に更新。

### Fixed
- 直接代入による分岐漏れリスクを低減し、状態遷移の追跡性を改善。

### Prompt
- User: これもやって / xstate: バトルの状態遷移（INTRO/ANIMATING/RESULT など）を明示化し、分岐バグを減らす。特に長期運用で効きます。
- Assistant（対応方針）: `xstate` を導入し、`BattleScene` と `battleMenu` の `state` 直接代入を状態機械経由に統一する。既存の状態分岐ロジックは維持し、最小差分で遷移の一元管理のみを導入する。

## [1.9.3] - 2026-03-01

### Note
- 既存 `zod` をセーブデータ検証に適用し、復旧フローを強化。

### Added
- `js/state/gameState.ts` にセーブデータ検証用 `zod` スキーマ群を追加。
- `tests/gameState.test.ts` に構造不正セーブからバックアップ復旧するテストを追加。

### Changed
- `gameState.load()` のメイン/バックアップ読み込みに `safeParse` ベースの検証処理を導入。
- `package.json` のバージョンを `1.9.2` から `1.9.3` に更新。

### Fixed
- JSONとしては有効でも構造不正なセーブデータをロードしてしまう問題を防止。

### Prompt
- User: 既存 zod をセーブデータ検証にも適用をやって
- Assistant（対応方針）: `gameState.load()` の `JSON.parse` 後に `zod` の `safeParse` を組み込み、検証失敗時は既存のバックアップ復旧フローへフォールバックする。既存の sanitize ロジックは維持し、最小差分で実装する。

## [1.9.2] - 2026-03-01

### Note
- 建物屋根の描画ずれ再発を根本修正したリリース。

### Added
- なし

### Changed
- 屋根描画ロジックをローカル座標依存から安定した配置処理へ調整。

### Fixed
- `renderBuildingDecorations()` の屋根位置ずれを修正。

### Prompt
- User: 建物の屋根が何度言っても修正されません
- Assistant（対応方針）: 屋根描画ロジックの実装箇所を特定し、座標系の問題を最小差分で修正する。

## [1.9.1] - 2026-03-01

### Note
- 複数シーン横断で8件の不具合・改善を一括反映した。

### Added
- なし

### Changed
- バトル・ワールド・メニュー・ショップ・状態管理を横断調整。

### Fixed
- 既存セッション継続分の不具合修正をまとめて反映。

### Prompt
- User: 既存セッションの継続として、以下8件の不具合/改善を実装すること。
- Assistant（対応方針）: 既存実装を横断確認し、最小差分で8件を一括修正。

## [1.9.0] - 2026-03-01

### Note
- 体験破綻を防ぐ進行安定化を中心に10件対応した。

### Added
- 全滅時に最後の回復地点へ復帰する導線を追加。

### Changed
- 屋根位置の再調整を実施。

### Fixed
- 進行周りの不具合を複数解消。

### Prompt
- User: ・まだ建物の屋根の位置がズレています
- Assistant（対応方針）: 影響範囲（World/Battle/Menu/Title/state/docs）を確認し、最小差分で実装。

## [1.8.1] - 2026-03-01

### Note
- 進行阻害と入力競合の修正を優先した安定化リリース。

### Added
- なし

### Changed
- 湿地ゲート条件を `forestScoutBeaten` に加えて `forestCrystalFound` でも通行可に変更。

### Fixed
- 森の守護者撃破後に湿地へ進めない不具合を修正。
- 会話→戦闘遷移の入力受付競合を調整。

### Prompt
- User: ・森の守護者に勝利しても湿地に進むことができません
- Assistant（対応方針）: 遷移条件（湿地ゲート）と、NPC会話から戦闘移行までの入力受付制御を `WorldScene` で調査し、最小差分で修正後に lint/typecheck/test を実行して検証する。

## [1.8.0] - 2026-03-01

### Note
- 商用品質向上を目的に主要機能を拡張した。

### Added
- 主要機能を6項目追加。

### Changed
- ゲーム体験全体のUX/演出を強化。

### Fixed
- なし

### Prompt
- User: このゲームで改善・追加実装すべきところを開発して商業レベルのクオリティに向上させてください
- Assistant（対応方針）: コードベース全体を調査し、商業レベルに不足している機能・演出・UXを洗い出す

## [1.7.0] - 2026-03-01

### Note
- セーブ復元の信頼性を高める品質改善リリース。

### Added
- なし

### Changed
- 商用品質に向けた不具合修正と品質強化を優先。

### Fixed
- `storyFlags` のロード欠落で進行フラグが復元されない問題を修正。

### Prompt
- User: このゲームで改善・追加実装すべきところを開発して商業レベルのクオリティに向上させてください
- Assistant（対応方針）: 既存コードを調査し、商用品質に直結する不具合修正と品質強化を優先。

## [1.6.1] - 2026-03-01

### Note
- 建物屋根の表示ずれを最小差分で修正。

### Added
- なし

### Changed
- `WorldScene` の屋根Y座標補正を調整。

### Fixed
- 屋根の位置ズレを修正。

### Prompt
- User: 建物の屋根の位置がズレているので修正してください
- Assistant（対応方針）: 屋根描画の座標計算を特定し、最小差分で位置ズレを修正する。

## [1.6.0] - 2026-03-01

### Note
- ショップ機能を売買前提の導線へ拡張。

### Added
- ショップ開始時に「かう / うる / やめる」メニューを追加。
- 売却導線と地域別在庫の運用を追加。

### Changed
- ショップUIで所持金表示を常時確認しやすく調整。

### Fixed
- なし

### Prompt
- User: ショップについて以下の改善を行ってください
- Assistant（対応方針）: 既存ショップ実装を確認し、最小差分で売買メニュー導入・売却処理追加・地域別在庫化・所持金常時表示を実装する。

## [1.5.0] - 2026-03-01

### Note
- メニュー体験を中心に9項目を改善。

### Added
- メニュー上下キーの長押しリピート移動を追加。

### Changed
- 図鑑・ガイド・マップ・設定を含むメニュー導線を横断調整。

### Fixed
- なし

### Prompt
- User: メニューについて以下の改善を行ってください
- Assistant（対応方針）: メニュー・図鑑・ガイド・マップ・設定の実装箇所を横断調査し、最小差分で機能追加。

## [1.4.1] - 2026-03-01

### Note
- 屋外探索スケールを大幅に拡張。

### Added
- なし

### Changed
- 全14屋外マップのサイズを約1.4〜1.55倍へ拡大。

### Fixed
- なし

### Prompt
- User: 「1マップ自体のサイズも大きくしてほしい」（前セッションからの継続作業）
- Assistant（対応方針）: 前セッションで6マップのcreateMapLayout座標スケーリングが完了済み

## [1.4.0] - 2026-03-01

### Note
- 記録未確認（該当バージョンの更新ログを確認できず）。

### Added
- なし

### Changed
- なし

### Fixed
- なし

### Prompt
- User: 記録未確認
- Assistant（対応方針）: 記録未確認

## [1.3.2] - 2026-03-01

### Note
- モンスターデータを大規模一括調整した。

### Added
- 進化アイテム3種と新規合成レシピ5件を追加。

### Changed
- 全77体の `secondaryType` / `learnset` / `catchRate` / `ability` / `spawnRate` / `heldItems` / `sizeScale` / `recipe` を調整。

### Fixed
- なし

### Prompt
- User: secondaryType learnset catchRate ability spawnRate heldItems sizeScale recipeも調整して
- Assistant（対応方針）: 全74体（+プール等含む77エントリ）のモンスターデータ8フィールドを一括調整するスクリプトを作成・実行

## [1.3.1] - 2026-03-01

### Note
- 記録未確認（該当バージョンの更新ログを確認できず）。

### Added
- なし

### Changed
- なし

### Fixed
- なし

### Prompt
- User: 記録未確認
- Assistant（対応方針）: 記録未確認

## [1.3.0] - 2026-03-01

### Note
- `secondaryType` を中核ロジックまで拡張した。

### Added
- モンスター種族に `secondaryType` を追加。

### Changed
- ダメージ計算・STAB・UI表示・パーティタイプ判定へ二次タイプを反映。
- 全77体の `monsters.json` を新形式へ移行。

### Fixed
- なし

### Prompt
- User: secondaryTypeの機能を追加して
- Assistant（対応方針）: 4つの変更を一括で対応。型定義→バリデーション→データ処理→バトル/UI→テスト→ドキュメントの順に実施。

## [1.2.1] - 2026-03-01

### Note
- モンスターデータの必須項目を明示化。

### Added
- `expYield` / `heldItems` / `sizeScale` を全モンスターで必須化。

### Changed
- 暗黙デフォルトを廃止し、型・スキーマ・処理を一貫更新。

### Fixed
- なし

### Prompt
- User: `expYield` / `heldItems` / `sizeScale` を追加し、全モンスターで必須、暗黙デフォルトなしにする。
- Assistant（対応方針）: スキーマ・型・実データ・バトル処理を一貫更新し、検証コマンドで回帰確認する。

## [1.2.0] - 2026-03-01

### Note
- モンスターデータ形式を新仕様へ統一。

### Added
- 全モンスターへ `ability` と `spawnRate` を付与。
- `recipe` 設定を導入。

### Changed
- 77体を新形式へ移行。

### Fixed
- `abilityId` をデータから廃止。

### Prompt
- User: 全てのモンスターを新形式に移行して（abilityId廃止, spawnRate, recipeの設定）
- Assistant（対応方針）: monsters.json を一括変換し、全モンスターで `ability` と `spawnRate` を付与、`abilityId` を削除。

## [1.1.16] - 2026-03-01

### Note
- 能力抽選・出現重み・合成参照を連携。

### Added
- モンスターに確率抽選の `ability` を追加。
- `spawnRate` と `recipe` を追加。

### Changed
- 読み込み・抽選・合成参照ロジックを新データへ対応。

### Fixed
- なし

### Prompt
- User: abilityはランダムに設定されるようにして
- Assistant（対応方針）: monsters.json のデータ拡張だけでなく、読み込み・抽選・合成参照ロジックを最小差分で対応。

## [1.1.15] - 2026-03-01

### Note
- 技習得データをレベル指定前提へ移行。

### Added
- なし

### Changed
- `learnset` を `{ move, level }` 形式へ統一。

### Fixed
- 旧形式受け入れを廃止し、不整合の余地を削減。

### Prompt
- User: 以下のように特定のレベルで技を覚えるようにして
- Assistant（対応方針）: `learnset` を `{ move, level }` 形式へ統一し、旧形式受け入れを廃止する。

## [1.1.14] - 2026-03-01

### Note
- 記録未確認（該当バージョンの更新ログを確認できず）。

### Added
- なし

### Changed
- なし

### Fixed
- なし

### Prompt
- User: 記録未確認
- Assistant（対応方針）: 記録未確認

## [1.1.13] - 2026-03-01

### Note
- グローバルマップに接続関係の可視化を追加。

### Added
- `renderGlobalMapView` にノードと接続線の地図表示を追加。

### Changed
- メニューのグローバルマップ描画を可読性重視で拡張。

### Fixed
- なし

### Prompt
- User: メニューのグローバルマップには地図を表示してください
- Assistant（対応方針）: メニューのグローバルマップ描画実装を確認し、最小差分で地図表示（接続関係の可視化）を追加する。

## [1.1.12] - 2026-03-01

### Note
- `sub_emoji` を全モンスターで明示管理へ。

### Added
- なし

### Changed
- 全77体に `sub_emoji` を設定（空配列または明示オーバーレイ）。

### Fixed
- 描画側の暗黙自動重ねロジックを削除。

### Prompt
- User: 全てのモンスターにsub_emojiのフィールドは設定するようにしてください
- Assistant（対応方針）: `sub_emoji` を必須フィールド化し、描画側の暗黙自動重ねロジックを削除する。

## [1.1.11] - 2026-03-01

### Note
- `sub_emoji` 指定の受理と描画指定を実装。

### Added
- モンスターデータで `sub_emoji` 配列を受け付ける仕様を追加。

### Changed
- `point` を位置キーワード/座標、`size` を倍率として処理。

### Fixed
- なし

### Prompt
- User: 以下の様に指定できるようにして
- Assistant（対応方針）: `sub_emoji` をデータとして受理できるよう、バリデーション・データ読込・型定義を拡張する。

## [1.1.10] - 2026-03-01

### Note
- 2グラフェム絵文字の重ね描画方式を導入。

### Added
- `js/ui/UIHelper.ts` にモンスター絵文字表示ヘルパーを追加。

### Changed
- 2グラフェム時は横並びでなくベース+オーバーレイ描画へ変更。

### Fixed
- なし

### Prompt
- User: ２文字の絵文字モンスターは絵文字を横に並べるのではなくて、絵文字に絵文字を重ねるように描画して
- Assistant（対応方針）: 既存のモンスター描画処理を特定し、2グラフェム絵文字のみ重ね描画に切り替える共通ヘルパーを実装。

## [1.1.9] - 2026-03-01

### Note
- 研究所スターター表示の違和感と残存表示を解消。

### Added
- なし

### Changed
- スターター台座で通常NPCアイコンを描画しない構成に変更。

### Fixed
- 顔絵文字の上にスターターが重なる表示不具合を修正。
- 関連する残存表示問題を修正。

### Prompt
- User: ・最初の3体が顔の絵文字の上に乗ってるのは変です
- Assistant（対応方針）: `WorldScene` のスターター台座描画と後処理を調査し、重なりと残存の根本原因を最小差分で修正する。

## [1.1.8] - 2026-03-01

### Note
- `WorldScene.ts` の責務分割を継続実施。

### Added
- 時刻/天候更新を `worldFieldEffects.ts` へ抽出。

### Changed
- ミニマップ描画等の委譲化で `WorldScene` の可読性を改善。

### Fixed
- なし

### Prompt
- User: WorldScene.ts の分割も進めて
- Assistant（対応方針）: `WorldScene.ts` のうち独立性が高い責務（時刻/天候演出、ミニマップ描画）を別モジュールへ分割し、`WorldScene` は委譲化して可読性を改善する。

## [1.1.7] - 2026-03-01

### Note
- 巨大化した戦闘シーンを責務単位で分割。

### Added
- `battleVisuals.ts` と `battleMessageFlow.ts` を新設。

### Changed
- `BattleScene` の背景/天候演出・メッセージ進行を委譲化。

### Fixed
- なし

### Prompt
- User: ソースコードが肥大化してきたので分割等のリファクタリングをして、AIがコードを読み込みやすくなるようにしてください
- Assistant（対応方針）: 最大ファイルを特定し、`BattleScene` から独立性の高い責務（背景/天候演出、メッセージ進行）を別モジュールへ分割して委譲化する。

## [1.1.6] - 2026-03-01

### Note
- 戦闘メニューの視認性と整列性を改善。

### Added
- なし

### Changed
- 戦闘パネルに共通基準座標を導入し、メッセージ欄・技一覧・技説明を再配置。

### Fixed
- 技一覧の表示崩れを解消。

### Prompt
- User: 戦闘メニューがメッセージ、技一覧、技の説明などが綺麗に並んでいないのが気になります
- Assistant（対応方針）: 戦闘メニューの描画実装（BattleScene/battleMenu）を確認し、最小差分で整列基準を統一して技一覧の表示崩れを解消する。

## [1.1.5] - 2026-03-01

### Note
- 屋根表示と環境演出条件の調整を実施。

### Added
- なし

### Changed
- 屋根三角形の配置アンカーを明示。

### Fixed
- 建物屋根のズレを修正。

### Prompt
- User: 建物の屋根がズレています
- Assistant（対応方針）: `WorldScene` の屋根描画と天候表示/天候パーティクル生成条件を調査し、最小差分で修正する。

## [1.1.4] - 2026-03-01

### Note
- 主要UI導線のRexUI統一を開始。

### Added
- なし

### Changed
- `UIHelper` のラベル/バッジ生成をRexUI化。
- タッチUI・主要HUDを含むUI生成箇所の置換を推進。

### Fixed
- なし

### Prompt
- User: UIは全てRexUIを利用するようにしてください
- Assistant（対応方針）: UI生成箇所を調査し、共通UIヘルパー・タッチUI・主要HUDからRexUIへ置換する。

## [1.1.3] - 2026-03-01

### Note
- タイトル版数表示をビルド時に自動同期。

### Added
- なし

### Changed
- `TitleScene` の固定版数表示を `v${__APP_VERSION__}` に変更。

### Fixed
- タイトル表示バージョンと `package.json` 版数の不一致を解消。

### Prompt
- User: タイトルで表示されているバージョンはpackage.jsonと一致するようにして（build時に解決するのがベスト？）
- Assistant（対応方針）: タイトル画面のハードコード版数を除去し、Viteのビルド時定数注入で`package.json`の`version`を表示する実装に変更する。

## [1.1.2] - 2026-03-01

### Note
- 建物外観と屋内導線をまとめて改善。

### Added
- 屋外に屋根付き建物の装飾描画を追加。
- ショップ/ジムの建物化と内装・NPC屋内配置を追加。

### Changed
- なし

### Fixed
- なし

### Prompt
- User: 屋根を付けるなど建物の見た目をマシにしてください。
- Assistant（対応方針）: ワールド描画・マップ遷移・NPC配置を確認し、最小差分で建物外観・屋内マップ・NPC移設を実装する。

## [1.1.1] - 2026-03-01

### Note
- 選択ダイアログの即時確定バグを修正。

### Added
- なし

### Changed
- `WorldScene` のスターター確認で入力ガードを追加。

### Fixed
- `はい/いいえ` ダイアログが表示直後に閉じる不具合を修正。

### Prompt
- User: ・はい/いいえの選択ダイアログが表示されていません
- Assistant（対応方針）: `WorldScene` と `BattleScene` の関連処理を調査し、原因を特定して最小差分で修正する。

## [1.1.0] - 2026-03-01

### Note
- 時間進行と時間帯連動天候を導入した基盤リリース。

### Added
- `gameState` にゲーム内時刻（00:00〜23:59）を追加しセーブ/ロード対応。
- 時間帯連動の天候変化とフィールド可視化を実装。

### Changed
- `mapRules` / `WorldScene` を時間概念対応へ拡張。

### Fixed
- なし

### Prompt
- User: 時間の概念を導入して、時間で天候が変わるようにして
- Assistant（対応方針）: `gameState` / `mapRules` / `WorldScene` を最小差分で拡張し、時間進行・時間帯連動天候・フィールド可視化を実装する。
