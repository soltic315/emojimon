// バトルHUD更新ロジック
import { calcStats } from "../../data/monsters.ts";
import {
  FONT,
  TYPE_BADGE_COLORS,
} from "../../ui/UIHelper.ts";
import {
  getStatusLabel,
  getStatusEmoji,
  getStatusColor,
} from "./battleConstants.ts";
import { gsap } from "gsap";

/** ラベルテキストの切り詰め */
export function truncateLabel(text, maxChars = 16) {
  const str = text == null ? "" : String(text);
  return str.length > maxChars ? `${str.slice(0, maxChars - 1)}…` : str;
}

function formatStageText(monster) {
  const atkStage = monster.attackStage || 0;
  const defStage = monster.defenseStage || 0;
  const status = getStatusLabel(monster.statusCondition);
  let text = "";
  if (atkStage !== 0) text += `攻${atkStage > 0 ? "+" : ""}${atkStage} `;
  if (defStage !== 0) text += `防${defStage > 0 ? "+" : ""}${defStage}`;
  if (status) text += `${text ? " " : ""}状:${status}`;
  return text.trim();
}

function applyTypeBadgeStyle(badgeObject, primaryType, secondaryType) {
  const mainType = primaryType || "NORMAL";
  const subType = secondaryType || null;
  const badgeColor = TYPE_BADGE_COLORS[mainType] || TYPE_BADGE_COLORS.NORMAL;
  const typeLabel = subType ? `${mainType}/${subType}` : mainType;
  badgeObject.setText(typeLabel);
  if (badgeObject.getElement) {
    badgeObject.getElement("text")?.setColor(badgeColor.text);
    badgeObject.getElement("background")?.setFillStyle(Phaser.Display.Color.HexStringToColor(badgeColor.bg).color, 0.9);
  } else {
    badgeObject.setColor(badgeColor.text);
    badgeObject.setBackgroundColor(badgeColor.bg);
  }
}

function updateHpBar(hpBar, currentHp, maxHp, animate) {
  const ratio = Math.max(0, currentHp / (maxHp || 1));
  const targetWidth = 140 * ratio;
  const color = ratio > 0.5 ? 0x22c55e : ratio > 0.25 ? 0xf97316 : 0xef4444;

  if (animate) {
    gsap.killTweensOf(hpBar);
    gsap.to(hpBar, {
      displayWidth: targetWidth,
      duration: 0.5,
      ease: "power2.out",
      onUpdate: () => {
        hpBar.setFillStyle(color, 1);
      },
    });
    return;
  }

  hpBar.displayWidth = targetWidth;
  hpBar.setFillStyle(color, 1);
}

/** HUD全体を更新 */
export function updateHud(scene, animate = false) {
  const player = scene.battle.player;
  const opponent = scene.battle.opponent;

  const playerStats = calcStats(player.species, player.level || 1);
  const oppStats = calcStats(opponent.species, opponent.level || 1);

  // プレイヤー情報
  const playerLabel = `${player.species.emoji || ""} ${player.species.name} Lv.${player.level}`;
  scene.playerNameText.setText(truncateLabel(playerLabel, 16));
  scene.playerHpText.setText(`${player.currentHp}/${playerStats.maxHp}`);

  // プレイヤータイプバッジ
  applyTypeBadgeStyle(scene.playerTypeBadge, player.species.primaryType, player.species.secondaryType);
  updateHpBar(scene.playerHpBar, player.currentHp, playerStats.maxHp, animate);

  // EXP バー
  const expRatio = player.nextLevelExp > 0 ? (player.exp || 0) / player.nextLevelExp : 0;
  const expTargetWidth = 136 * Math.min(1, expRatio);
  scene.playerExpText.setText(`${player.exp || 0}/${player.nextLevelExp || "?"}`);
  if (animate) {
    gsap.killTweensOf(scene.playerExpBar);
    gsap.to(scene.playerExpBar, {
      displayWidth: expTargetWidth,
      duration: 0.4,
      ease: "power2.out",
    });
  } else {
    scene.playerExpBar.displayWidth = expTargetWidth;
  }

  // ステージ表示
  scene.playerStageText.setText(formatStageText(player));

  // 相手情報
  const prefix = scene.isBoss ? "👑 " : "";
  const opponentLabel = `${prefix}${opponent.species.emoji || ""} ${opponent.species.name} Lv.${opponent.level}`;
  scene.opponentNameText.setText(truncateLabel(opponentLabel, 16));
  scene.opponentHpText.setText(`${opponent.currentHp}/${oppStats.maxHp}`);
  scene.opponentStatusText.setText(formatStageText(opponent));

  // 相手タイプバッジ
  applyTypeBadgeStyle(scene.opponentTypeBadge, opponent.species.primaryType, opponent.species.secondaryType);
  updateHpBar(scene.opponentHpBar, opponent.currentHp, oppStats.maxHp, animate);

  // 状態異常バッジ
  updateStatusBadge(scene, "player", player.statusCondition);
  updateStatusBadge(scene, "opponent", opponent.statusCondition);
}

/** モンスター絵文字の下に状態異常アイコンを表示 */
export function updateStatusBadge(scene, side, statusCondition) {
  const key = `${side}StatusBadge`;
  const keyBg = `${side}StatusBadgeBg`;

  if (scene[key]) { scene[key].destroy(); scene[key] = null; }
  if (scene[keyBg]) { scene[keyBg].destroy(); scene[keyBg] = null; }

  if (!statusCondition) return;

  const emoji = getStatusEmoji(statusCondition);
  const label = getStatusLabel(statusCondition);
  const color = getStatusColor(statusCondition);
  if (!emoji) return;

  const emojiText = side === "player" ? scene.playerEmojiText : scene.opponentEmojiText;
  const badgeX = emojiText.x;
  const badgeY = emojiText.y + 38;

  scene[keyBg] = scene.rexUI?.add?.roundRectangle
    ? scene.rexUI.add.roundRectangle(badgeX, badgeY, 58, 16, 8, 0x0f172a, 0.85)
      .setOrigin(0.5)
      .setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(color).color, 0.7)
      .setDepth(10)
    : scene.add.rectangle(badgeX, badgeY, 58, 16, 0x0f172a, 0.85)
      .setOrigin(0.5)
      .setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(color).color, 0.7)
      .setDepth(10);

  scene[key] = scene.rexUI?.add?.label
    ? scene.rexUI.add.label({
      x: badgeX,
      y: badgeY,
      text: scene.add.text(0, 0, `${emoji}${label}`, {
        fontFamily: FONT.UI,
        fontSize: 10,
        color,
      }).setOrigin(0.5),
      align: "center",
    }).setDepth(11).layout()
    : scene.add.text(badgeX, badgeY, `${emoji}${label}`, {
      fontFamily: FONT.UI,
      fontSize: 10,
      color,
    }).setOrigin(0.5).setDepth(11);

  scene.tweens.add({
    targets: [scene[key], scene[keyBg]],
    alpha: 0.5,
    duration: 1000,
    yoyo: true,
    repeat: -1,
    ease: "sine.inOut",
  });
}
