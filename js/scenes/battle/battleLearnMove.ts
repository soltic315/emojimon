// バトル技習得UI
import { getMonsterMoves } from "../../data/monsters.ts";
import { MOVES } from "../../data/moves.ts";
import { audioManager } from "../../audio/AudioManager.ts";
import {
  FONT,
  COLORS,
  TEXT_COLORS,
  drawPanel,
  drawSelection,
} from "../../ui/UIHelper.ts";
import { BattleState, MAX_MOVE_SLOTS } from "./battleConstants.ts";

/** 技習得選択の開始 */
export function startLearnMoveSelection(scene, monster, learnedMoves) {
  if (!monster || !Array.isArray(learnedMoves) || learnedMoves.length === 0) return;
  scene.learnMoveMonster = monster;
  scene.pendingLearnMoves = [...learnedMoves];
  scene.currentLearnMove = null;
  scene.selectedLearnReplaceIndex = 0;
  openNextLearnMoveSelection(scene);
}

/** 次の技習得候補を開く */
export function openNextLearnMoveSelection(scene) {
  if (!Array.isArray(scene.pendingLearnMoves) || scene.pendingLearnMoves.length === 0) {
    scene.currentLearnMove = null;
    scene.learnMoveMonster = null;
    scene.selectedLearnReplaceIndex = 0;
    scene.setBattleState(BattleState.PLAYER_TURN);
    scene.showMainMenu(false);
    return false;
  }

  scene.currentLearnMove = scene.pendingLearnMoves.shift();
  scene.selectedLearnReplaceIndex = 0;
  scene.setBattleState(BattleState.PLAYER_SELECT_LEARN_REPLACE);
  renderLearnMoveReplaceMenu(scene);
  return true;
}

/** 技入替メニューの描画 */
export function renderLearnMoveReplaceMenu(scene) {
  const monster = scene.learnMoveMonster;
  const move = scene.currentLearnMove;
  if (!monster || !move) return;

  scene.clearMenuTexts();
  const currentMoves = getMonsterMoves(monster).slice(0, MAX_MOVE_SLOTS);
  const options = [
    ...currentMoves.map((knownMove) => `わすれる: ${knownMove.name}`),
    "おぼえない",
  ];

  if (scene.selectedLearnReplaceIndex >= options.length) {
    scene.selectedLearnReplaceIndex = 0;
  }

  const panelX = (scene.panelDividerX || 0) + 8;
  const panelY = (scene.panelY || 0) + 30;
  const panelW = Math.max(180, (scene.panelX + scene.panelWidth - 12) - panelX);
  const panelH = 22 + options.length * 24;

  const panel = scene.add.graphics();
  drawPanel(panel, panelX, panelY, panelW, panelH, {
    radius: 10,
    headerHeight: 18,
    bgAlpha: 0.94,
    glow: true,
    borderColor: COLORS.SELECT_BORDER,
  });
  scene.menuTextGroup.push(panel);

  const title = scene.add.text(panelX + 10, panelY + 3, `${move.name}を どうする？`, {
    fontFamily: FONT.UI,
    fontSize: 12,
    color: TEXT_COLORS.ACCENT,
  });
  scene.menuTextGroup.push(title);

  options.forEach((label, index) => {
    const rowY = panelY + 24 + index * 24;
    if (index === scene.selectedLearnReplaceIndex) {
      const selection = scene.add.graphics();
      drawSelection(selection, panelX + 6, rowY - 1, panelW - 12, 22, { radius: 7 });
      scene.menuTextGroup.push(selection);
    }
    const text = scene.add.text(panelX + 14, rowY + 2, `${index === scene.selectedLearnReplaceIndex ? "▶" : " "} ${label}`, {
      fontFamily: FONT.UI,
      fontSize: 13,
      color: index === scene.selectedLearnReplaceIndex ? "#f8fafc" : "#cbd5e1",
    });
    scene.menuTextGroup.push(text);
  });

  scene.messageText.setText(`${monster.species.name}は ${move.name}を おぼえたい！`);
}

/** 技入替の確定 */
export function confirmLearnMoveReplaceSelection(scene) {
  const monster = scene.learnMoveMonster;
  const move = scene.currentLearnMove;
  if (!monster || !move) return;

  const currentMoveIds = Array.isArray(monster.moveIds) ? monster.moveIds : [];
  const replaceableCount = Math.min(MAX_MOVE_SLOTS, currentMoveIds.length);

  if (scene.selectedLearnReplaceIndex >= replaceableCount) {
    scene.enqueueMessage(`${monster.species.name}は ${move.name}を おぼえるのを やめた。`);
  } else {
    const forgetMoveId = currentMoveIds[scene.selectedLearnReplaceIndex];
    const forgetMove = MOVES[forgetMoveId];
    currentMoveIds[scene.selectedLearnReplaceIndex] = move.id;
    const pp = Array.isArray(monster.pp) ? monster.pp : [];
    pp[scene.selectedLearnReplaceIndex] = Math.max(1, move.pp || 10);
    monster.pp = pp;
    scene.enqueueMessage(`${monster.species.name}は ${forgetMove?.name || "わざ"}を わすれた！`);
    scene.enqueueMessage(`${monster.species.name}は ${move.name}を おぼえた！`);
  }

  openNextLearnMoveSelection(scene);
}

/** 技習得をスキップ */
export function skipLearnMoveReplaceSelection(scene) {
  const monster = scene.learnMoveMonster;
  const move = scene.currentLearnMove;
  if (monster && move) {
    scene.enqueueMessage(`${monster.species.name}は ${move.name}を おぼえるのを やめた。`);
  }
  openNextLearnMoveSelection(scene);
}

/** 技入替メニューのナビゲーション */
export function handleLearnReplaceMenuNavigation(scene) {
  const moveCount = scene.learnMoveMonster?.moveIds?.length || 0;
  const optionsCount = Math.min(MAX_MOVE_SLOTS, moveCount) + 1;
  if (optionsCount <= 0) return;

  if (scene.isNavUpPressed()) {
    scene.selectedLearnReplaceIndex = (scene.selectedLearnReplaceIndex - 1 + optionsCount) % optionsCount;
    audioManager.playCursor();
    renderLearnMoveReplaceMenu(scene);
  } else if (scene.isNavDownPressed()) {
    scene.selectedLearnReplaceIndex = (scene.selectedLearnReplaceIndex + 1) % optionsCount;
    audioManager.playCursor();
    renderLearnMoveReplaceMenu(scene);
  }
}
