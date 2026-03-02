// バトル結果・報酬処理
import { gameState } from "../../state/gameState.ts";
import {
  checkEvolution,
  evolveMonster,
  syncMonsterMoves,
  MAX_MOVE_SLOTS,
} from "../../data/monsters.ts";
import { getItemById } from "../../data/items.ts";
import { audioManager } from "../../audio/AudioManager.ts";
import {
  EXP_MULT_WILD,
  EXP_MULT_ARENA,
  EXP_MULT_GYM,
  EXP_MULT_TRAINER,
  SHARED_EXP_RATIO,
  BattleState,
} from "./battleConstants.ts";
import { flashVictory } from "../../ui/FXHelper.ts";

const GYM_REWARD_BY_NUMBER = {
  1: {
    apply: () => {
      gameState.gymCleared = true;
    },
    message: "ジムバッジを てにいれた！ おめでとう！ 🏆",
  },
  2: {
    apply: () => {
      gameState.storyFlags.frozenPeakGymCleared = true;
    },
    message: "アイスバッジを てにいれた！ おめでとう！ 🏆❄️",
  },
};

function applyGymClearReward(scene, gymNumber) {
  const safeGymNumber = Math.max(1, Math.floor(gymNumber || 1));
  const reward = GYM_REWARD_BY_NUMBER[safeGymNumber];
  if (reward) {
    reward.apply();
    scene.enqueueMessage(reward.message);
    return;
  }

  const fallbackFlag = `gym${safeGymNumber}Cleared`;
  if (Object.prototype.hasOwnProperty.call(gameState.storyFlags || {}, fallbackFlag)) {
    gameState.storyFlags[fallbackFlag] = true;
  } else {
    gameState.gymCleared = true;
  }
  scene.enqueueMessage(`${safeGymNumber}つめの ジムバッジを てにいれた！ おめでとう！ 🏆`);
}

/** 勝利処理 */
export function handleVictory(scene) {
  scene.resultType = "win";
  scene.setBattleState(BattleState.RESULT);
  audioManager.playVictory();
  flashVictory(scene.cameras.main);

  // 相手の消滅エフェクト
  scene._playDefeatEffect(scene.opponentEmojiText);

  const opponent = scene.battle.opponent;
  let battleLabel;
  if (scene.isArena) battleLabel = "闘技場の";
  else if (scene.isBoss) battleLabel = "ジムリーダーの";
  else if (scene.isTrainer) battleLabel = `${scene.trainerName}の`;
  else battleLabel = "野生の";
  scene.enqueueMessage(`${battleLabel} ${opponent.species.name}は たおれた！`);

  // 共通の報酬処理
  processVictoryRewards(scene, opponent, scene.battle.player);

  // ジムクリアフラグ
  if (scene.isBoss) {
    applyGymClearReward(scene, scene.battle.gymNumber);
  }
}

/** 勝利/スキップ共通の報酬処理（経験値・レベルアップ・進化・お金・連勝） */
export function processVictoryRewards(scene, opponent, leader) {
  const encounterBonusMul = opponent.rewardMultiplier || 1;
  const totalBonusMul = encounterBonusMul;

  // 経験値計算
  const expMultiplier = scene.isArena ? EXP_MULT_ARENA : (scene.isBoss ? EXP_MULT_GYM : (scene.isTrainer ? EXP_MULT_TRAINER : EXP_MULT_WILD));
  const levelFactor = Math.max(1, (opponent.level || 1)) / 5;
  const expGain = Math.max(1, Math.floor(opponent.species.baseExpYield * levelFactor * expMultiplier * totalBonusMul));
  scene.enqueueMessage(`${expGain} けいけんちを かくとく！`);
  if (encounterBonusMul > 1.01) {
    const bonusPct = Math.round((totalBonusMul - 1) * 100);
    scene.enqueueMessage(`ボーナスで けいけんち +${bonusPct}%！`);
  }

  // パーティ全員に経験値を分配
  const levelUpResult = gameState.addExpToMonsterDetailed(leader, expGain);
  gameState.addBond(leader, 2);

  gameState.party.forEach((m) => {
    if (m !== leader && m.species && m.currentHp > 0) {
      const shareExp = Math.max(1, Math.floor(expGain * SHARED_EXP_RATIO));
      gameState.addExpToMonster(m, shareExp);
      gameState.addBond(m, 1);
    }
  });

  if (levelUpResult.levelsGained > 0) {
    audioManager.playLevelUp();
    scene.enqueueMessage(`${leader.species.name}は レベル ${leader.level} に あがった！`);
    if (levelUpResult.learnedMoves.length > 0) {
      const knownMoveIds = new Set(Array.isArray(leader.moveIds) ? leader.moveIds : []);
      const pendingReplaceMoves = [];
      levelUpResult.learnedMoves.forEach((move) => {
        if (knownMoveIds.has(move.id)) {
          scene.enqueueMessage(`${leader.species.name}は ${move.name}を おぼえた！`);
          return;
        }
        if ((leader.moveIds || []).length < MAX_MOVE_SLOTS) {
          leader.moveIds = [...(leader.moveIds || []), move.id].slice(0, MAX_MOVE_SLOTS);
          knownMoveIds.add(move.id);
          scene.enqueueMessage(`${leader.species.name}は ${move.name}を おぼえた！`);
          return;
        }
        pendingReplaceMoves.push(move);
      });

      if (pendingReplaceMoves.length > 0) {
        scene.enqueueMessage(`${leader.species.name}の わざが いっぱいだ！`);
        scene._startLearnMoveSelection(leader, pendingReplaceMoves);
      }
    }
    scene._playLevelUpEffect(scene.playerEmojiText);

    // 進化チェック
    const evo = checkEvolution(leader);
    if (evo) {
      const oldName = leader.species.name;
      evolveMonster(leader, evo);
      syncMonsterMoves(leader);
      scene.enqueueMessage(`おめでとう！ ${oldName}は ${leader.species.name}に しんかした！ 🎉`);
      scene._playEvolutionEffect(
        scene.playerEmojiText,
        leader.species.emoji,
        leader.species.subEmoji,
        leader.species.sizeScale,
      );
    }
  }

  grantHeldItemDrops(scene, opponent);

  // お金
  const baseMoney = opponent.level * (scene.isBoss ? 30 : 10);
  const moneyGain = Math.max(1, Math.floor(baseMoney * totalBonusMul));
  gameState.addMoney(moneyGain);
  scene.enqueueMessage(`${moneyGain}Gを てにいれた！`);

  if (scene.isWildBattle && scene._isTutorialBattle) {
    gameState.storyFlags.tutorialBattleDone = true;
    gameState.save();
  }

  // 図鑑登録
  if (opponent.species?.id && !gameState.seenIds.includes(opponent.species.id)) {
    gameState.seenIds.push(opponent.species.id);
  }
}

/** 持ち物ドロップ付与 */
export function grantHeldItemDrops(scene, opponent) {
  const heldItems = Array.isArray(opponent?.species?.heldItems) ? opponent.species.heldItems : [];
  heldItems.forEach((entry) => {
    if (!entry || !entry.itemId) return;
    const dropRate = Number.isFinite(entry.dropRate)
      ? Math.max(0, Math.min(1, entry.dropRate))
      : 0;
    if (dropRate <= 0) return;
    if (Math.random() > dropRate) return;
    gameState.addItem(entry.itemId, 1);
    const itemDef = getItemById(entry.itemId);
    const itemName = itemDef?.name || entry.itemId;
    scene.enqueueMessage(`${opponent.species.name}の もちもの ${itemName}を てにいれた！`);
  });
}

/** 敗北処理 */
export function handleDefeat(scene) {
  scene.resultType = "lose";
  scene.setBattleState(BattleState.RESULT);
  audioManager.playDefeat();
  const player = scene.battle.player;
  scene.enqueueMessage(`${player.species.name}は たおれてしまった…`);
  scene.enqueueMessage("めのまえが まっくらに なった…");
}
