# CHANGELOG

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
