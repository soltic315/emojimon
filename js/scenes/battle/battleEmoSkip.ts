// エモ・スキップ UI & 実行ロジック
import { FONT } from "../../ui/UIHelper.ts";
import { audioManager } from "../../audio/AudioManager.ts";
import { BattleState } from "./battleConstants.ts";

/** スキップ可能ヒントとプログレスバーの生成 */
export function createEmoSkipUI(scene) {
  const { width, height } = scene.scale;
  const cx = width / 2;
  const indicatorY = height * 0.82;

  scene.emoSkipHintText = scene.add.text(cx, indicatorY - 20, "⚡ Zキー長押しで エモ・スキップ ⚡", {
    fontFamily: FONT.UI,
    fontSize: 13,
    color: "#fbbf24",
    stroke: "#000000",
    strokeThickness: 3,
    shadow: { offsetX: 0, offsetY: 1, color: "#f59e0b", blur: 8, fill: true },
  }).setOrigin(0.5).setAlpha(0.9).setDepth(100);

  scene.tweens.add({
    targets: scene.emoSkipHintText,
    alpha: 0.4,
    duration: 700,
    yoyo: true,
    repeat: -1,
    ease: "sine.inOut",
  });

  const barWidth = 160;
  const barHeight = 8;
  scene.emoSkipBarBg = scene.rexUI?.add?.roundRectangle
    ? scene.rexUI.add.roundRectangle(cx, indicatorY, barWidth, barHeight, 4, 0x1e293b, 0.8)
      .setOrigin(0.5).setStrokeStyle(1, 0x475569, 0.6).setDepth(100)
    : scene.add.rectangle(cx, indicatorY, barWidth, barHeight, 0x1e293b, 0.8)
      .setOrigin(0.5).setStrokeStyle(1, 0x475569, 0.6).setDepth(100);

  scene.emoSkipBar = scene.rexUI?.add?.roundRectangle
    ? scene.rexUI.add.roundRectangle(cx - barWidth / 2, indicatorY, 0, barHeight, 4, 0xfbbf24, 0.95)
      .setOrigin(0, 0.5).setDepth(101)
    : scene.add.rectangle(cx - barWidth / 2, indicatorY, 0, barHeight, 0xfbbf24, 0.95)
      .setOrigin(0, 0.5).setDepth(101);

  scene.emoSkipBarWidth = barWidth;
}

/** スキッププログレスバーを更新 (0.0 〜 1.0) */
export function updateEmoSkipProgress(scene, ratio) {
  const r = Phaser.Math.Clamp(ratio, 0, 1);
  if (scene.emoSkipBar) {
    scene.emoSkipBar.displayWidth = scene.emoSkipBarWidth * r;
    const g = Math.floor(191 + (255 - 191) * r);
    const b = Math.floor(36 + (255 - 36) * r);
    scene.emoSkipBar.setFillStyle(Phaser.Display.Color.GetColor(251, g, b), 0.95);
  }
  if (scene.emoSkipHintText && r > 0) {
    scene.emoSkipHintText.setScale(1 + r * 0.1);
  }
}

/** スキップUI要素を破棄 */
export function destroyEmoSkipUI(scene) {
  if (scene.emoSkipHintText) { scene.emoSkipHintText.destroy(); scene.emoSkipHintText = null; }
  if (scene.emoSkipBarBg) { scene.emoSkipBarBg.destroy(); scene.emoSkipBarBg = null; }
  if (scene.emoSkipBar) { scene.emoSkipBar.destroy(); scene.emoSkipBar = null; }
}

/** エモ・スキップ実行 — 一瞬でバトル結果を生成して終了 */
export function executeEmoSkip(scene) {
  destroyEmoSkipUI(scene);
  scene.clearMenuTexts();
  scene.messageQueue = [];
  scene.currentMessage = null;

  scene.cameras.main.flash(300, 251, 191, 36, true);
  audioManager.playVictory();

  const opponent = scene.battle.opponent;
  const player = scene.battle.player;
  opponent.currentHp = 0;
  scene.updateHud(true);

  scene._playDefeatEffect(scene.opponentEmojiText);

  scene.resultType = "win";
  scene.setBattleState(BattleState.RESULT);

  scene.enqueueMessage("⚡ エモ・スキップ！ 一瞬で けりがついた！");

  scene._processVictoryRewards(opponent, player);
}
