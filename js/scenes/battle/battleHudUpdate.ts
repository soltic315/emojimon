// バトルHUD更新ロジック
import { calcStats } from "../../data/monsters.ts";
import {
  FONT,
} from "../../ui/UIHelper.ts";
import {
  getStatusLabel,
  getStatusEmoji,
  getStatusColor,
} from "./battleConstants.ts";
import { gsap } from "gsap";

/** ラベルテキストの切り詰め */
export function truncateLabel(text, maxChars = 16) {
  const str = String(text || "");
  return str.length > maxChars ? `${str.slice(0, maxChars - 1)}…` : str;
}

/** HUD全体を更新 */
export function updateHud(scene, animate = false) {
  const player = scene.battle.player;
  const opponent = scene.battle.opponent;

  const playerStats = calcStats(player.species, player.level || 1);
  const oppStats = calcStats(opponent.species, opponent.level || 1);

  // タイプバッジ色マップ
  const typeBadgeColors = {
    FIRE: { bg: "#7c2d12", text: "#fb923c" },
    WATER: { bg: "#1e3a5f", text: "#60a5fa" },
    GRASS: { bg: "#14532d", text: "#4ade80" },
    NORMAL: { bg: "#374151", text: "#d1d5db" },
    ELECTRIC: { bg: "#713f12", text: "#facc15" },
    ICE: { bg: "#164e63", text: "#67e8f9" },
  };

  // プレイヤー情報
  const playerLabel = `${player.species.emoji || ""} ${player.species.name} Lv.${player.level}`;
  scene.playerNameText.setText(truncateLabel(playerLabel, 16));
  scene.playerHpText.setText(`${player.currentHp}/${playerStats.maxHp}`);

  // プレイヤータイプバッジ
  const pType = player.species.primaryType || "NORMAL";
  const pSecType = player.species.secondaryType || null;
  const pBadge = typeBadgeColors[pType] || typeBadgeColors.NORMAL;
  const pTypeLabel = pSecType ? `${pType}/${pSecType}` : pType;
  scene.playerTypeBadge.setText(pTypeLabel);
  if (scene.playerTypeBadge.getElement) {
    scene.playerTypeBadge.getElement("text")?.setColor(pBadge.text);
    scene.playerTypeBadge.getElement("background")?.setFillStyle(Phaser.Display.Color.HexStringToColor(pBadge.bg).color, 0.9);
  } else {
    scene.playerTypeBadge.setColor(pBadge.text);
    scene.playerTypeBadge.setBackgroundColor(pBadge.bg);
  }

  const pRatio = Math.max(0, player.currentHp / (playerStats.maxHp || 1));
  const pTargetWidth = 140 * pRatio;
  const pColor = pRatio > 0.5 ? 0x22c55e : pRatio > 0.25 ? 0xf97316 : 0xef4444;

  if (animate) {
    gsap.killTweensOf(scene.playerHpBar);
    gsap.to(scene.playerHpBar, {
      displayWidth: pTargetWidth,
      duration: 0.5,
      ease: "power2.out",
      onUpdate: () => {
        scene.playerHpBar.setFillStyle(pColor, 1);
      },
    });
  } else {
    scene.playerHpBar.displayWidth = pTargetWidth;
    scene.playerHpBar.setFillStyle(pColor, 1);
  }

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
  const atkStg = player.attackStage || 0;
  const defStg = player.defenseStage || 0;
  const playerStatus = getStatusLabel(player.statusCondition);
  let stageStr = "";
  if (atkStg !== 0) stageStr += `攻${atkStg > 0 ? "+" : ""}${atkStg} `;
  if (defStg !== 0) stageStr += `防${defStg > 0 ? "+" : ""}${defStg}`;
  if (playerStatus) stageStr += `${stageStr ? " " : ""}状:${playerStatus}`;
  scene.playerStageText.setText(stageStr.trim());

  // 相手情報
  const prefix = scene.isBoss ? "👑 " : "";
  const opponentLabel = `${prefix}${opponent.species.emoji || ""} ${opponent.species.name} Lv.${opponent.level}`;
  scene.opponentNameText.setText(truncateLabel(opponentLabel, 16));
  scene.opponentHpText.setText(`${opponent.currentHp}/${oppStats.maxHp}`);
  const opponentStatus = getStatusLabel(opponent.statusCondition);
  scene.opponentStatusText.setText(opponentStatus ? `状:${opponentStatus}` : "");

  // 相手タイプバッジ
  const oType = opponent.species.primaryType || "NORMAL";
  const oSecType = opponent.species.secondaryType || null;
  const oBadge = typeBadgeColors[oType] || typeBadgeColors.NORMAL;
  const oTypeLabel = oSecType ? `${oType}/${oSecType}` : oType;
  scene.opponentTypeBadge.setText(oTypeLabel);
  if (scene.opponentTypeBadge.getElement) {
    scene.opponentTypeBadge.getElement("text")?.setColor(oBadge.text);
    scene.opponentTypeBadge.getElement("background")?.setFillStyle(Phaser.Display.Color.HexStringToColor(oBadge.bg).color, 0.9);
  } else {
    scene.opponentTypeBadge.setColor(oBadge.text);
    scene.opponentTypeBadge.setBackgroundColor(oBadge.bg);
  }

  const oRatio = Math.max(0, opponent.currentHp / (oppStats.maxHp || 1));
  const oTargetWidth = 140 * oRatio;
  const oColor = oRatio > 0.5 ? 0x22c55e : oRatio > 0.25 ? 0xf97316 : 0xef4444;

  if (animate) {
    gsap.killTweensOf(scene.opponentHpBar);
    gsap.to(scene.opponentHpBar, {
      displayWidth: oTargetWidth,
      duration: 0.5,
      ease: "power2.out",
      onUpdate: () => {
        scene.opponentHpBar.setFillStyle(oColor, 1);
      },
    });
  } else {
    scene.opponentHpBar.displayWidth = oTargetWidth;
    scene.opponentHpBar.setFillStyle(oColor, 1);
  }

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
