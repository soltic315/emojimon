# CHANGELOG

## [2.1.14] - 2026-03-03

### Note
- スタミナ移行後に発生していた「技コストの粗さ」「相手側のスタミナ運用不整合」「回復アイテム量の過大」を同時に調整し、テンポと駆け引きのバランスを再最適化した。

### Added
- `tests/battleTurnFlow.test.ts` に、相手がスタミナ不足で全技を使えない場合に `null` を返すAI選択テストを追加。
- `tests/moves.test.ts` に、技スタミナコスト自動算出（高威力技高コスト/変化技軽コスト）の回帰テストを追加。

### Changed
- `js/data/moves.ts` の `getMoveStaminaCost()` を更新し、`staminaCost` 未指定時は `pp` に加えて威力・優先度・自己回復・強力補助効果・高確率状態異常を反映した 1〜5 のコスト自動算出へ変更。
- `js/data/monsters.ts` の最大スタミナを種族基礎値由来（8〜12）に拡張し、正規化/回復処理を個体依存で計算するよう変更。
- `js/scenes/battle/battleTurnFlow.ts` の相手行動処理を修正し、スタミナ不足技の強行使用を禁止。AI選択で使用可能技がない場合は `null` を返すよう変更。
- `js/scenes/BattleScene.ts` / `js/scenes/battle/battleMenu.ts` / `js/scenes/battle/battleItems.ts` / `js/scenes/MenuScene.ts` / `js/scenes/menu/views/partyView.ts` のスタミナ表示・回復上限参照を個体別最大スタミナへ統一。
- `js/data/wildEncounters.ts` / `js/scenes/WorldScene.ts` / `js/scenes/world/worldTrainerArena.ts` / `js/scenes/battle/battleCatch.ts` / `js/state/saveSchema.ts` / `js/state/gameState.ts` の生成・保存・ロード時スタミナ初期値を種族別最大スタミナへ同期。
- `assets/data/items.json` のスタミナ回復量を調整（`ETHER: 10→4`, `MEGA_ETHER: 20→8`）。
- `GAME_DESIGN.md` にスタミナ仕様（種族別最大値、技コスト自動算出、回復アイテム段階）を追記。
- `package.json` / `package-lock.json` のバージョンを `2.1.13` から `2.1.14` に更新。

### Fixed
- 相手AIが「使えないはずの高コスト技」を実質的に使用できてしまうスタミナ不整合を修正。
- エーテル系の回復量が最大スタミナ運用に対して過剰だったバランス崩れを修正。

### Prompt
- User: `直近追加されたスタミナにモンスターや技やアイテムが最適化されていないようです
バランス調整をしてください`
- Assistant（対応方針）: スタミナ関連の計算式・AI行動・回復アイテム値を横断調整し、種族差分の導入とテスト追加を含めて最小差分で同期する。

## [2.1.13] - 2026-03-03

### Note
- NPC見た目仕様の解釈ずれを修正し、「顔文字を上貼り」ではなく「顔の絵文字そのものをNPC本体として表示」へ統一した。

### Added
- なし

### Changed
- `js/scenes/WorldScene.ts` のNPC生成処理を調整し、ベースNPCスプライト + 顔文字ラベル重ね表示を廃止して、顔の絵文字をNPC本体として描画するよう変更。
- `js/scenes/world/worldNpcFlavor.ts` の役割別 `ROLE_FACE_POOL` を顔文字文字列から顔の絵文字プールへ更新。
- `tests/worldNpcFlavor.test.ts` の期待値を顔の絵文字仕様へ更新。
- `package.json` / `package-lock.json` のバージョンを `2.1.12` から `2.1.13` に更新。

### Fixed
- NPCが「絵文字の上に顔文字を貼る」見た目になっていた仕様解釈ミスを修正。

### Prompt
- User: `NPCに顔文字と言いましたが、絵文字の上に顔文字を貼り付けろという意味ではありません
NPCには顔の絵文字を利用するという意味でした`
- Assistant（対応方針）: NPC描画を顔文字オーバーレイ方式から顔絵文字本体表示へ切り替え、顔プール・テスト・版数・履歴を最小差分で同期する。

## [2.1.12] - 2026-03-03

### Note
- メニュー詳細画面の情報量拡張を目的に、右メニュー/左詳細の分割表示を見直し、詳細を全画面サブパネル表示へ統一した。
- グローバルマップは実装と視認性を簡素化するため、接続線グラフから格子セル表示へ移行した。

### Added
- なし

### Changed
- `js/scenes/menu/menuViewsShared.ts` の `SUB_PANEL_WIDTH_OFFSET` を全画面サブパネル前提の左右マージン値へ変更。
- `js/scenes/menu/views/globalMapView.ts` を再構成し、ノード接続線描画を廃止して格子セルベースのマップ表示へ変更。
- `js/scenes/menu/menuConstants.ts` のガイド文言を、グローバルマップの格子表示仕様に合わせて更新。
- `GAME_DESIGN.md` に、サブ詳細全画面表示とグローバルマップ格子表示の仕様を追記。
- `package.json` / `package-lock.json` のバージョンを `2.1.11` から `2.1.12` に更新。

### Fixed
- 詳細表示領域が左右分割で狭く、情報表示量に制約が出る問題を改善。
- グローバルマップの接続線レイアウトが複雑で調整コストが高い問題を改善。

### Prompt
- User: `現在、メニュー画面は右にメニュー左に詳細という形になっていますが、情報を多く表示するために詳細は全画面で表示するようにしてください
それにあわせて各詳細画面のUIも調整してください
またマップは実装をシンプルにするために格子で表現するようにしてください`
- Assistant（対応方針）: サブパネル幅を全画面化し既存詳細ビューを共通反映、グローバルマップは接続線グラフを廃止して格子セル表示へ置換する。

## [2.1.11] - 2026-03-03

### Note
- NPC体験向上を主目的として、見た目・会話・挙動の3軸を同時に更新した。
- 実装変更に合わせて `GAME_DESIGN.md` と版数（`package.json` / `package-lock.json`）を同期した。

### Added
- `js/scenes/world/worldNpcFlavor.ts` を追加し、NPCの顔文字ラベル・役割別話者名・会話候補プール生成を実装。
- `tests/worldNpcFlavor.test.ts` を追加し、会話抽選・話者ラベル・移動可否の回帰テストを追加。

### Changed
- `js/scenes/WorldScene.ts` のNPC生成処理を拡張し、顔文字ラベル表示とNPCランタイム管理（徘徊状態・予約タイル）を導入。
- `js/scenes/WorldScene.ts` の通常会話と一部依頼会話をランダム会話化し、話者名ウィンドウと整合する表示へ変更。
- `js/scenes/WorldScene.ts` にNPC徘徊移動（半径制限・衝突回避・入力ロック時停止）を追加。
- `types/game.d.ts` の `NpcDef` に、顔文字/話者/会話プール/徘徊設定フィールドを追加。
- `GAME_DESIGN.md` のフィールド仕様に、NPC顔文字運用・ランダム会話・徘徊移動ルールを追記。
- `package.json` / `package-lock.json` のバージョンを `2.1.10` から `2.1.11` に更新。

### Fixed
- 町・フィールドで同一NPCが常に同じ短文だけを返す単調さを改善。
- NPCが静止し続けることで探索画面の生活感が薄い問題を改善。
- 会話UIで話者情報が薄く、誰が話しているか判別しにくいケースを改善。

### Prompt
- User: `NPCについて大幅にアップデートしてください
- 見た目のバラエティを増やす（NPCには顔文字を使用し、モンスターには使用しない）
- 会話のクオリティやバラエティを増やす（ランダムで会話が変わると良い）
- NPCが移動するようにする

その他、ゲームのクオリティ向上のためにやった方がいいことがあれば実装してください`
- Assistant（対応方針）: NPC用フレーバーヘルパーを新設して見た目/会話データを一元化し、WorldSceneに徘徊移動と会話表示統合を最小差分で実装する。

## [2.1.10] - 2026-03-03

### Note
- 優先度と対応工数のバランスを重視し、A〜I の TODO から15件（`A-11` / `A-13` / `B-14` / `D-23` / `E-07` / `E-08` / `E-14` / `E-16` / `E-19` / `E-32` / `E-33` / `F-21` / `H-01` / `H-02` / `H-05`）を完了した。
- ユーザー指定に従い、TODO完了後に `lint -> typecheck -> test -> build` の順で検証を実施した。

### Added
- `tests/battleItems.test.ts` を追加し、バトル中アイテム効果（HP回復・状態異常治癒・捕獲ボール分岐）の回帰テストを追加。
- `tests/storyFlags.test.ts` を追加し、`STORY_FLAG_KEYS` と `sanitizeStoryFlags` の整合テストを追加。
- `tests/worldShop.test.ts` を追加し、ショップ在庫の地域差分・フォールバック・参照分離テストを追加。
- `tests/uiHelper.test.ts` を追加し、`UIHelper` の描画スモーク/明るさ適用テストを追加。
- `tests/menuViews.test.ts` を追加し、メニュー主要ビューのディスパッチ/描画スモークテストを追加。

### Changed
- `js/state/gameState.ts` で保存処理を一時キー経由に変更し、`SAVE_KEY -> SAVE_TEMP_KEY -> SAVE_BACKUP_KEY` の順で復旧を試行するよう改善。
- `js/scenes/BootScene.ts` で起動時データ検証失敗時にJSON再読込リトライ（1回）を追加。
- `js/state/storyFlags.ts` に `STORY_FLAG_KEYS` を追加し、フラグキーの列挙参照を導入。
- `js/data/moves.ts` の初期化を `MOVE_DEFAULTS + spread` 構成へ変更し、項目追加時の取りこぼしを抑制。
- `js/scenes/MenuScene.ts` / `js/state/gameState.ts` でメニュー再オープン時に前回タブ位置を復元する仕様を追加。
- `js/audio/AudioManager.ts` を含む `js/**` の空 `catch` を診断ログ付きへ統一し、障害解析性を改善。
- `tests/gameKeyboard.test.ts` / `tests/worldInputGuards.test.ts` / `tests/dataValidation.test.ts` / `tests/moves.test.ts` / `tests/gameState.test.ts` を拡張。
- `GAME_DESIGN.md` にセーブ復旧経路（tmp復旧/容量上限通知）とメニュー前回タブ復元仕様を追記。
- `TODO.md` から完了済み15件を削除し、統計サマリーを更新。
- `package.json` / `package-lock.json` のバージョンを `2.1.9` から `2.1.10` に更新。

### Fixed
- セーブ途中中断時にメイン・バックアップの双方が不整合になるリスクを軽減。
- 初回ロード時の一時的なJSON読込失敗で起動不能になるケースを再読込で自己回復。
- セーブ失敗時に成功音が鳴る誤挙動を修正し、容量上限時に明確な失敗メッセージを表示。
- 例外握りつぶしにより原因追跡が困難だった箇所を診断ログ化して改善。

### Prompt
- User: `優先度と対応工数のバランスを考えてA~IのTODOを15完了してください。lint/typecheck/test/buildは全てのTODOを完了した後に実施してください。`
- Assistant（対応方針）: A〜I から高優先かつ小〜中工数の15件を最小差分で実装し、TODO/仕様書/版数/変更履歴を同期した後に `lint/typecheck/test/build` を順次実施する。

## [2.1.9] - 2026-03-03

### Note
- 優先度と対応工数のバランスを重視し、A〜I の TODO から15件（`A-16` / `B-13` / `B-16` / `B-18` / `C-21` / `D-27` / `E-04` / `E-05` / `E-10` / `E-11` / `E-17` / `E-29` / `E-31` / `F-14` / `I-01`）を完了した。
- ユーザー指定に従い、TODO完了後に `lint -> typecheck -> test -> build` の順で検証を実施した。

### Added
- `tests/achievements.test.ts` を追加し、実績判定の条件整合・ヒント解決・ID重複防止の回帰テストを追加。
- `tests/wildEncounters.test.ts` を追加し、全エリア出現プールと第2ジムボス参照のテストを追加。
- `tests/audioManager.test.ts` を追加し、マップキー解決と同一BGM重複再生抑止のテストを追加。
- `tests/battleTurnFlow.test.ts` を追加し、行動順計算（優先度/補正/同速）のテストを追加。
- `tests/battleVisuals.test.ts` を追加し、天候遷移純粋関数の遷移分岐テストを追加。

### Changed
- `js/data/moves.ts` に `MOVE_STAMINA_COST_MIN/MAX` を追加し、スタミナコスト範囲の共通定数化を実施。
- `js/data/dataValidation.ts` で相互参照整合チェックを強化し、`inflictStatus/statusChance` 整合と状態異常ID検証を追加。
- `js/scenes/menu/views/trainerView.ts` で氷峰ジム・四天王・ポストゲーム進捗を表示するよう拡張。
- `js/scenes/battle/battleHudUpdate.ts` でプレイヤー/相手HUD共通処理をヘルパー化し重複ロジックを削減。
- `js/scenes/battle/battleVisuals.ts` で `resolveWeatherTickTransition` を新設し、`tickWeather` の遷移判定を純粋関数へ分離。
- `js/scenes/title/titleHelp.ts` / `js/scenes/menu/menuConstants.ts` でガイド文言の操作用語を「決定/キャンセル」基準へ統一。
- `tests/dataValidation.test.ts` / `tests/gameState.test.ts` を拡張し、新規検証ケース（プール検証・ボックス操作）を追加。
- `README.md` にデータJSON編集ガイド（検証手順）を追記。
- `GAME_DESIGN.md` に起動時検証要件、データ編集運用、タイプ分布分析、トレーナー表示仕様の更新を反映。
- `TODO.md` から完了済み15件を削除し、統計サマリーを更新。
- `package.json` / `package-lock.json` のバージョンを `2.1.8` から `2.1.9` に更新。

### Fixed
- データ定義で `inflictStatus` と `statusChance` の片側指定が通ってしまう不整合を修正。
- メニューのトレーナー画面で氷峰ジム・四天王・ポストゲーム進捗が未表示だった問題を修正。
- 天候遷移ロジックのテスト困難だった分岐を純粋関数化し、回帰検知を可能化。
- シーン復帰時の同一BGM重複再生抑止をテストで保証。

### Prompt
- User: `優先度と対応工数のバランスを考えてA~IのTODOを15完了してください。lint/typecheck/test/buildは全てのTODOを完了した後に実施してください。`
- Assistant（対応方針）: A〜I から高優先かつ小〜中工数の15件を最小差分で実装し、TODO/仕様書/版数/変更履歴を同期した後に `lint/typecheck/test/build` を順次実施する。

## [2.1.8] - 2026-03-02

### Note
- 優先度と対応工数のバランスを重視し、A〜I の TODO から15件（`A-23` / `B-28` / `C-22` / `C-23` / `D-25` / `E-22` / `E-23` / `E-24` / `E-27` / `E-28` / `E-30` / `F-24` / `F-27` / `G-15` / `H-04`）を完了した。
- ユーザー指定に従い、TODO完了後に `lint -> typecheck -> test -> build` の順で検証を実施した（`build` は実行環境上の操作で完了ログ取得をスキップ）。

### Added
- `tests/battleMessageFlow.test.ts` を追加し、メッセージキュー処理・速度倍率・自動送り・長押し高速送りの回帰テストを追加。
- `tests/gameKeyboard.test.ts` を追加し、入力文字サニタイズ（制御文字/禁止文字除去）と文字数制限のテストを追加。

### Changed
- `js/scenes/menu/views/settingsView.ts` / `js/scenes/menu/menuViews.ts` / `js/scenes/MenuScene.ts` で設定画面の左右キー専用ハンドラ解除を共通化し、画面切替・メニュー終了時に確実に解放するよう変更。
- `js/scenes/menu/views/pokedexView.ts` でわざ一覧の `slice(0, 6)` 制限を撤廃し、習得わざ全件を表示するよう変更。
- `js/scenes/battle/battleHudUpdate.ts` で相手HUDにも攻撃/防御ステージ変化を表示するよう変更。
- `js/scenes/menu/views/boxView.ts` / `js/scenes/menu/views/pokedexView.ts` / `js/scenes/menu/views/globalMapView.ts` にスクロールインジケータを追加。
- `js/scenes/menu/views/bagView.ts` で一覧スクロールと下部固定説明パネルを導入し、説明テキスト重なりを防止。
- `js/scenes/menu/menuViewsShared.ts` に一時メッセージ表示ヘルパー `showTransientMenuMessage` を追加し、`partyView`/`boxView`/`bagView` の重複実装を統合。
- `js/scenes/battle/battleVisuals.ts` の天候パーティクル更新を固定33msタイマーからフレーム同期更新へ変更。
- `js/scenes/world/worldMapData.ts` の毒沼ダメージコメントを実装仕様（生存中のパーティ全員）へ一致させた。
- `js/ui/gameKeyboard.ts` に `sanitizeKeyboardText` を追加し、`js/scenes/title/titleNameInput.ts` / `js/scenes/menu/menuSceneNickname.ts` で入力名サニタイズを適用。
- `js/state/gameState.ts` に `removeItem` を追加し、`js/scenes/MenuScene.ts` のバッグ消費処理を集約。
- `tests/battleResultRewards.test.ts` / `tests/battleCalcStatus.test.ts` / `tests/evolution.test.ts` / `tests/gameState.test.ts` を拡張。
- `GAME_DESIGN.md` にメニュー一覧のスクロールインジケータ仕様・バッグ説明欄仕様・名前入力フィルタ仕様を追記。
- `TODO.md` から完了済み15件を削除し、統計サマリーを更新。
- `package.json` と `package-lock.json` のバージョンを `2.1.7` から `2.1.8` に更新。

### Fixed
- 設定画面の左右キー入力が他ビューへリークする問題を修正。
- 図鑑で7件以上のわざが確認できない問題を修正。
- バトルHUDで相手のステージ変化が見えない問題を修正。
- バッグ説明文がリスト末尾と重なりうる表示崩れを修正。
- 天候パーティクルがフレームレートと非同期でちらつく問題を軽減。
- 入力名で制御文字/禁止文字が保存されうる問題を修正。

### Prompt
- User: `優先度と対応工数のバランスを考えてA~IのTODOを15完了してください。lint/typecheck/test/buildは全てのTODOを完了した後に実施してください。`
- Assistant（対応方針）: 高優先かつ小〜中工数の15件をA〜Iから選定して最小差分で実装し、TODO/仕様書/版数/変更履歴を同期した後に検証を実施する。

## [2.1.6] - 2026-03-02

### Note
- 優先度と対応工数のバランスを重視し、A〜I の TODO から5件（`B-23` / `C-24` / `D-24` / `F-23` / `G-16`）を完了した。

### Added
- `js/ui/UIHelper.ts` に `TYPE_BADGE_COLORS` を追加し、タイプバッジ配色の共通定義を導入。

### Changed
- `js/scenes/battle/battleHudUpdate.ts` のタイプバッジ配色参照をローカル定義から `TYPE_BADGE_COLORS` に統一。
- `js/scenes/menu/views/partyView.ts` / `js/scenes/menu/views/boxView.ts` / `js/scenes/menu/views/pokedexView.ts` のタイプ色参照を `TEXT_COLORS` に統一。
- `js/scenes/menu/views/achievementsView.ts` のスクロール計算を、`headerHeight` / `itemHeight` の差異を考慮する方式に変更。
- `js/scenes/menu/views/globalMapView.ts` で、マップキー・接続エッジ・接続先一覧をモジュールスコープで事前構築する方式へ変更。
- `js/scenes/title/titleHelp.ts` の操作説明に「メニュー操作」「長押し」「タッチ操作」を追記。
- `TODO.md` から完了済みの `B-23` / `C-24` / `D-24` / `F-23` / `G-16` を削除し、統計サマリーを更新。
- `package.json` と `package-lock.json` のバージョンを `2.1.5` から `2.1.6` に更新。

### Fixed
- 画面ごとに散在していたタイプ色定義の重複と、バトルHUD配色定義の分散を解消。
- 実績画面でヘッダー行と項目行の高さ差により選択位置がずれる問題を修正。
- グローバルマップ描画時の不要な `Set` 再生成と重複走査を削減。
- タイトルヘルプに不足していた操作説明（メニュー/長押し/タッチ）を補完。

### Prompt
- User: `優先度と対応工数のバランスを考えてA~IのTODOを5~10個を完了してください。lint/typecheck/test/buildは全てのTODOを完了した後に実施してください。`
- User: `CHANGELOGを更新して`
- Assistant（対応方針）: A〜Iから高優先かつ小〜中工数の5件を最小差分で実装し、TODO/版数/変更履歴を同期する。

## [2.1.5] - 2026-03-02

### Note
- 優先度と対応工数のバランスを重視し、A〜I の TODO から型乖離の高優先5件を完了した。

### Added
- なし

### Changed
- `types/game.d.ts` の `Move` 型で `pp` を受理し、`staminaCost` をオプショナル化して `moves.json` との名称差異を吸収。
- `types/game.d.ts` の `Item` 型に `battleUsable` と `effect`（ネスト構造）を追加し、実データ構造へ同期。
- `types/game.d.ts` に `ItemEffect` を追加し、`heal/revive/healAllPP/cureStatus/evolution` 等の実在エフェクト型を定義。
- `types/game.d.ts` の `InventoryItem` を `id/count` から `itemId/quantity` へ変更し、実装と一致させた。
- `types/game.d.ts` の `MonsterSpecies` を `sub_emoji` / `abilityRates` / `learnsetLevels` 等へ対応し、JSON/ランタイム双方の表現差を吸収。
- `TODO.md` から完了済みの `B-19` / `B-20` / `B-25` / `B-26` / `B-27` を削除し、統計サマリーを更新。
- `package.json` と `package-lock.json` のバージョンを `2.1.4` から `2.1.5` に更新。

### Fixed
- 型定義と実データの構造不一致により参照エラーや見落としが発生しうる問題を改善。

### Prompt
- User: `優先度と対応工数のバランスを考えてA~IのTODOを5~10個を完了してください。lint/typecheck/test/buildは全てのTODOを完了した後に実施してください。`
- Assistant（対応方針）: A〜Iのうち高優先かつ小工数で完了可能な型乖離5件（B-19/B-20/B-25/B-26/B-27）を最小差分で実装し、TODO/版数/変更履歴を同期した後に `lint/typecheck/test/build` を順次実行して検証する。

## [2.1.4] - 2026-03-02

### Note
- 優先度と対応工数のバランスを重視し、進行リスク/堅牢性/UI崩れ系のTODOを7件完了した。

### Added
- なし

### Changed
- `js/data/monsters.ts` と関連呼び出し群で `getMonsterMaxStamina()` を無引数呼び出しへ統一。
- `js/scenes/title/titleNameInput.ts` で、隠し入力要素をシーン `shutdown/destroy` 時にもクリーンアップするよう変更。
- `js/state/saveSchema.ts` / `js/data/wildEncounters.ts` / `js/scenes/WorldScene.ts` / `js/scenes/world/worldTrainerArena.ts` / `js/scenes/battle/battleCatch.ts` で、生成モンスターの `speedStage` 初期値を `0` に統一。
- `js/scenes/menu/views/partyView.ts` のわざ表示Y座標を固定値から動的計算へ変更。
- `js/scenes/battle/battleResultRewards.ts` のジム報酬分岐を、`gymNumber===2` 固定分岐から報酬マップ + フォールバック方式に変更。
- `js/scenes/battle/battleMessageFlow.ts` のキュー消化後遷移を `PLAYER_SELECT_MOVE/ITEM/SWITCH/LEARN_REPLACE` に拡張。
- `js/scenes/battle/battleVisuals.ts` の `tickWeather` をマップ別天候ロールベースへ変更。
- `TODO.md` から完了済みの `A-21` / `A-22` / `A-24` / `B-22` / `F-25` / `H-16` / `H-17` を削除し、統計サマリーを更新。
- `package.json` と `package-lock.json` のバージョンを `2.1.3` から `2.1.4` に更新。

### Fixed
- マップテーマに不整合な天候が戦闘中に発生しうる問題を修正。
- タイトル名入力の隠しDOM要素がシーン破棄時に残留しうる問題を修正。
- 生成モンスターで `speedStage` 初期化漏れに `|| 0` フォールバック依存していた問題を修正。
- パーティ詳細画面で技リストが詳細テキスト量次第で重なりうる問題を修正。
- ジム報酬分岐の将来拡張性が低い固定条件分岐を改善。
- 戦闘メッセージキュー終了後の遷移フォールスルーを改善。

### Prompt
- User: `優先度と対応工数のバランスを考えてA~IのTODOを5~10個を完了してください。lint/typecheck/test/buildは全てのTODOを完了した後に実施してください。`
- Assistant（対応方針）: A〜Iから高優先度かつ小〜中工数の7件を最小差分で実装し、TODO/版数/変更履歴を同期したうえで最後に `lint/typecheck/test/build` を順次実行して検証する。

## [2.1.3] - 2026-03-02

### Note
- 優先度と対応工数のバランスを重視し、セキュリティ/運用/ドキュメント系を中心にTODOを6件完了した。

### Added
- `assets/og-image.svg` を追加し、SNS共有時のプレビュー用画像を用意。
- `TODO.md` に「TODO運用ルール（未着手/着手中/保留/完了）」を追記。
- `GAME_DESIGN.md` にテスト方針（単体/統合/手動確認範囲・実行順序）を追記。

### Changed
- `index.html` に `Content-Security-Policy` メタタグを追加。
- `index.html` に Open Graph / Twitter Card メタタグを追加。
- `index.html` に `<noscript>` フォールバック文言を追加。
- `js/scenes/title/titleVisuals.ts` の版数表示を `__APP_VERSION__` の防御参照へ変更（未定義時は `dev`）。
- `TODO.md` から完了済みの `F-28` / `H-19` / `H-20` / `H-21` / `J-07` / `K-13` を削除し、統計サマリーを更新。
- `package.json` と `package-lock.json` のバージョンを `2.1.2` から `2.1.3` に更新。

### Fixed
- JavaScript無効時に白画面で何も表示されない問題を改善。
- Vite外環境で `__APP_VERSION__` が未定義の場合に版数描画で例外化しうる問題を改善。

### Prompt
- User: `優先度と対応工数のバランスを考えてTODOを5~10個を完了してください。lint/typecheck/test/buildは全てのTODOを完了した後に実施してください。`
- Assistant（対応方針）: 高優先度に直結する低〜中工数タスクを6件選定して最小差分で実装・文書反映し、最後に `lint/typecheck/test/build` を一括実行して検証する。

## [2.1.2] - 2026-03-02

### Note
- 優先度と工数のバランスを重視し、進行リスク系4件・データ乖離2件・機能不足1件・テスト系3件の計8件を完了した。

### Added
- `tests/battleHudUpdate.test.ts` に `truncateLabel` の回帰テスト（`0`入力保持・省略記号付与）を追加。
- `tests/battleResultRewards.test.ts` に `grantHeldItemDrops` の回帰テスト（`dropRate` 未定義時非ドロップ・有効値時ドロップ）を追加。

### Changed
- `js/data/moves.ts` の `initMovesFromJson` で `targetDefenseStage` をマッピング対象に追加。
- `js/data/dataValidation.ts` の `moveSchema` に `targetDefenseStage` を追加。
- `js/scenes/battle/battleResultRewards.ts` のドロップ判定を `dropRate` 有限値チェック + `0..1` クランプへ変更。
- `js/scenes/battle/battleHudUpdate.ts` の `truncateLabel` で `0` を空文字化しないように変更。
- `js/audio/areaBgm.ts` に `DARK_TOWER` の `dark` マッピングを追加。
- `tests/moves.test.ts` に `targetDefenseStage` 取り込みテストを追加。
- `tests/dataValidation.test.ts` に `targetDefenseStage` を許容する検証テストを追加。
- `tests/areaBgm.test.ts` に `DARK_TOWER` / `MISTY_SWAMP` / `SAND_VALLEY` / `SHADOW_GROVE` の検証ケースを追加。
- `TODO.md` から完了済みの `A-19` / `A-20` / `B-21` / `B-24` / `C-25` / `E-21` / `E-25` / `E-26` を削除し、統計サマリーを更新。
- `package.json` と `package-lock.json` のバージョンを `2.1.1` から `2.1.2` に更新。

### Fixed
- 防御ダウン技で `targetDefenseStage` が取り込まれず効果が失われる問題を修正。
- `dropRate` 未定義時の意図しない持ち物ドロップを修正。
- `truncateLabel(0, ...)` が空文字になる不具合を修正。
- `DARK_TOWER` で専用BGMキーが解決されない問題を修正。

### Prompt
- User: `優先度と対応工数のバランスを考えてTODOを5~10個を完了してください。lint/typecheck/test/buildは全てのTODOを完了した後に実施してください。`
- Assistant（対応方針）: 高優先度かつ小〜中工数のTODOを8件選定して最小差分で実装・テスト追加を行い、最後に `lint/typecheck/test/build` を一括実行して検証する。

## [2.1.1] - 2026-03-02

### Note
- 戦闘画面のレイアウト生成で発生する `drawPanel is not defined` 例外を解消し、バトル開始時のクラッシュを防止した。

### Added
- なし

### Changed
- `js/scenes/BattleScene.ts` の `UIHelper` import に `drawPanel` を追加。
- `package.json` と `package-lock.json` のバージョンを `2.1.0` から `2.1.1` に更新。

### Fixed
- 戦闘画面で `buildLayout()` 実行時に `drawPanel` が未定義となり、シーン生成時にクラッシュする問題を修正。

### Prompt
- User: `戦闘画面で以下のエラーが発生します index-CIl_KzgB.js:254 Uncaught ReferenceError: drawPanel is not defined`
- Assistant（対応方針）: `BattleScene` の import 漏れを最小差分で補正し、必須の `lint/typecheck/test/build` を実行してから版数と変更履歴を同期する。

## [2.1.0] - 2026-03-02

### Note
- 実績システムにヒント表示と達成報酬を追加し、解除導線と達成体験を強化した。

### Added
- `js/data/achievements.ts` に実績ヒント解決と報酬解決（G/アイテム）の共通ヘルパーを追加。
- `tests/gameState.test.ts` に、実績報酬の付与と重複付与防止の回帰テストを追加。

### Changed
- `js/state/gameState.ts` の実績チェック処理で、実績解除時に報酬を即時付与するよう変更。
- `js/scenes/menu/views/achievementsView.ts` で、未解除実績の選択時にヒントを表示し、解除/未解除とも報酬内容を表示するよう変更。
- `js/scenes/WorldScene.ts` の実績トーストに報酬表示（🎁）を追加。
- `GAME_DESIGN.md` の実績仕様へ、ヒント表示と報酬付与ルールを追記。
- `package.json` と `package-lock.json` のバージョンを `2.0.1` から `2.1.0` に更新。

### Fixed
- 実績解除時のリワード導線が存在せず、達成の即時的なリターンが弱かった問題を改善。

### Prompt
- User: `実績機能にヒントと報酬を追加して`
- Assistant（対応方針）: 実績定義へヒント/報酬解決層を追加し、解除時の報酬自動付与・実績画面表示・トースト表示・テスト・仕様書・版数を最小差分で同期する。

## [2.0.1] - 2026-03-02

### Note
- タイトル設定UI・名前入力導線・戦闘開始時入力・クエスト表示条件を調整し、進行体験の破綻とネタバレを抑制した。

### Added
- なし

### Changed
- `js/scenes/title/titleSettings.ts` の行間・行高さ・フッター位置計算を見直し、低解像度でも設定項目と操作ヒントが重ならないように調整。
- `js/scenes/title/titleNameInput.ts` に入力画面オープン直後のキー誤反応ガードを追加し、`Enter/Escape` で即時確定・即時閉鎖される挙動を防止。
- `js/scenes/BattleScene.ts` の入力処理を調整し、エモスキップ有効時でも確定操作が無効化されないよう変更。
- `js/scenes/menu/views/questView.ts` のストーリークエストを段階解放表示へ変更し、未到達ストーリーのネタバレ表示を抑制。
- `GAME_DESIGN.md` のクエスト表示仕様を、ストーリー/サブ/ポストゲームすべてトリガー到達後表示に更新。
- `package.json` と `package-lock.json` のバージョンを `2.0.0` から `2.0.1` に更新。

### Fixed
- タイトル設定画面で項目テキストと下部ガイドが重なって読みにくくなる問題を修正。
- 主人公名入力画面が表示されない（表示直後に確定扱いで遷移してしまう）問題を修正。
- 戦闘開始時に確定入力が効かず、操作不能に見えるケースを修正。
- ストーリークエストが先行表示されることによるネタバレを抑制。

### Prompt
- User: `- 設定画面の文字が重なっています`
- User: `- 主人公の名前入力画面が表示されません`
- User: `- 戦闘に入るとフリーズします`
- User: `- ストーリークエストもネタバレはやめてください`
- Assistant（対応方針）: 4項目を最小差分で同時修正し、UIレイアウト・入力誤反応・戦闘入力経路・クエスト解放条件を調整。仕様書・版数・検証結果を同期する。

## [2.0.0] - 2026-03-02

### Note
- 正式リリース前方針に合わせ、旧セーブデータ互換のための暫定処理を削除し、現行セーブ形式へ統一した。

### Added
- なし

### Changed
- `js/state/saveSchema.ts` のシリアライズモンスタースキーマから、旧 `pp` 配列の受け入れを削除。
- `js/state/gameState.ts` のロード処理から、旧セーブ向け `storyFlags` 自動補完（`starterChosen` 等を強制完了扱いにする処理）を削除。
- `tests/gameState.test.ts` に、`party` が存在しても `storyFlags` を自動補完しない挙動のテストを追加。
- `GAME_DESIGN.md` の保存仕様に、旧バージョンセーブとの後方互換を保証しない方針を明記。
- `TODO.md` から互換前提のテストタスク `E-06` を削除し、統計サマリーを更新。
- `package.json` と `package-lock.json` のバージョンを `1.20.0` から `2.0.0` に更新。

### Fixed
- 旧セーブ互換の補正処理が残存し続けることで、保存仕様が曖昧になる問題を解消。

### Prompt
- User: `正式リリース前なので既存のセーブデータとの互換性は維持しなくてもよいです。互換性維持のための実装を削除してリファクタリングしてください。`
- Assistant（対応方針）: セーブ互換のための明示ロジック（旧 `pp` 受理・旧 `storyFlags` 補完）を削除し、テスト・仕様書・版数・TODOを最小差分で同期する。

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
