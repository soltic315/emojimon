// バトル中アイテム使用ロジック
import { gameState } from "../../state/gameState.ts";
import { calcStats, getMonsterMoves } from "../../data/monsters.ts";
import { audioManager } from "../../audio/AudioManager.ts";
import { BattleState, StatusCondition } from "./battleConstants.ts";

/**
 * バトル中のアイテム使用を実行する。
 * アイテム効果の適用、消費、相手ターンへの移行を行う。
 */
export function performUseItem(scene) {
  const battleItems = scene.currentBattleItems || [];
  if (battleItems.length === 0) {
    scene.showMainMenu(true);
    return;
  }

  const selection = battleItems[scene.selectedItemIndex];
  if (!selection) return;

  const { entry, def } = selection;
  const player = scene.getActivePlayer();
  let itemConsumed = false;
  const catchBonus = def.catchBonus || (def.id === "EMO_BALL" ? 1 : 0);
  const isCatchBall = catchBonus > 0;

  if (isCatchBall) {
    if (!scene.isWildBattle) {
      scene.enqueueMessage("いまは ボールを つかえない！");
      scene.showMainMenu(true);
      return;
    }
    scene.attemptCatch({ entry, bonus: catchBonus, name: def.name, emoji: def.emoji });
    return;
  }

  if (!def.effect) {
    scene.enqueueMessage("しかし なにも おきなかった…");
    scene.startOpponentTurn();
    return;
  }

  // 効果適用
  if (def.effect.type === "heal") {
    const stats = calcStats(player.species, player.level || 1);
    const maxHp = stats.maxHp;
    const before = player.currentHp;
    player.currentHp = Math.min(maxHp, player.currentHp + (def.effect.amount || 0));
    const healed = player.currentHp - before;
    scene.updateHud(true);

    if (healed > 0) {
      audioManager.playHeal();
      scene.enqueueMessage(`${def.name}を つかった！ HPが ${healed} かいふくした！`);
      itemConsumed = true;
    } else {
      scene.enqueueMessage("しかし HPは まんたんだ！");
    }
  } else if (def.effect.type === "buffAttack") {
    const before = player.attackStage || 0;
    player.attackStage = scene.clampStage(before + (def.effect.stages || 1));
    if (player.attackStage !== before) {
      scene.enqueueMessage(`${def.name}で ${player.species.name}の こうげきが あがった！`);
      itemConsumed = true;
    } else {
      scene.enqueueMessage("しかし これいじょう あがらない！");
    }
  } else if (def.effect.type === "buffDefense") {
    const before = player.defenseStage || 0;
    player.defenseStage = scene.clampStage(before + (def.effect.stages || 1));
    if (player.defenseStage !== before) {
      scene.enqueueMessage(`${def.name}で ${player.species.name}の ぼうぎょが あがった！`);
      itemConsumed = true;
    } else {
      scene.enqueueMessage("しかし これいじょう あがらない！");
    }
  } else if (def.effect.type === "revive") {
    // リバイブ: 戦闘不能の味方を復活（パーティ内）
    const fainted = gameState.party.find((m) => m.species && m.currentHp <= 0 && m !== player);
    if (fainted) {
      const stats = calcStats(fainted.species, fainted.level || 1);
      fainted.currentHp = Math.floor(stats.maxHp * (def.effect.amount || 0.5));
      audioManager.playHeal();
      scene.enqueueMessage(`${def.name}で ${fainted.species.name}が ふっかつした！`);
      itemConsumed = true;
    } else {
      scene.enqueueMessage("しかし つかえなかった…");
    }
  } else if (def.effect.type === "cureStatus") {
    // 状態異常回復アイテム
    const targetStatus = def.effect.status;
    if (player.statusCondition && player.statusCondition === targetStatus) {
      const statusLabel = scene.getStatusLabel(player.statusCondition);
      player.statusCondition = StatusCondition.NONE;
      audioManager.playHeal();
      scene.enqueueMessage(`${def.name}で ${statusLabel}が なおった！`);
      itemConsumed = true;
    } else {
      scene.enqueueMessage("しかし つかえなかった…");
    }
  } else if (def.effect.type === "fullRestore") {
    // パーフェクトケア: HP全回復+状態異常回復
    const stats = calcStats(player.species, player.level || 1);
    const maxHp = stats.maxHp;
    const before = player.currentHp;
    player.currentHp = maxHp;
    const healed = player.currentHp - before;
    if (player.statusCondition && player.statusCondition !== StatusCondition.NONE) {
      const statusLabel = scene.getStatusLabel(player.statusCondition);
      player.statusCondition = StatusCondition.NONE;
      audioManager.playHeal();
      scene.enqueueMessage(`${def.name}を つかった！ HPが ${healed} かいふくし ${statusLabel}も なおった！`);
      itemConsumed = true;
    } else if (healed > 0) {
      audioManager.playHeal();
      scene.enqueueMessage(`${def.name}を つかった！ HPが ${healed} かいふくした！`);
      itemConsumed = true;
    } else {
      scene.enqueueMessage("しかし HPは まんたんだ！");
    }
    scene.updateHud(true);
  } else if (def.effect.type === "buffSpeed") {
    // クイックステップ
    const before = player.speedStage || 0;
    player.speedStage = scene.clampStage(before + (def.effect.stages || 1));
    if (player.speedStage !== before) {
      scene.enqueueMessage(`${def.name}で ${player.species.name}の すばやさが あがった！`);
      itemConsumed = true;
    } else {
      scene.enqueueMessage("しかし これいじょう あがらない！");
    }
  } else if (def.effect.type === "buffAttackSpeed") {
    // げきりんキャンディ: 攻撃+1 & 速度+1
    const aBefore = player.attackStage || 0;
    const sBefore = player.speedStage || 0;
    player.attackStage = scene.clampStage(aBefore + (def.effect.stages || 1));
    player.speedStage = scene.clampStage(sBefore + (def.effect.stages || 1));
    if (player.attackStage !== aBefore || player.speedStage !== sBefore) {
      scene.enqueueMessage(`${def.name}で ${player.species.name}の こうげきと すばやさが あがった！`);
      itemConsumed = true;
    } else {
      scene.enqueueMessage("しかし これいじょう あがらない！");
    }
  } else if (def.effect.type === "buffDefenseHeal") {
    // ガードチャーム: 防御+1 & HP回復
    const dBefore = player.defenseStage || 0;
    player.defenseStage = scene.clampStage(dBefore + (def.effect.stages || 1));
    const stats = calcStats(player.species, player.level || 1);
    const healAmount = Math.floor(stats.maxHp * (def.effect.healPercent || 0.15));
    const hpBefore = player.currentHp;
    player.currentHp = Math.min(stats.maxHp, player.currentHp + healAmount);
    const healed = player.currentHp - hpBefore;
    if (player.defenseStage !== dBefore || healed > 0) {
      audioManager.playHeal();
      const msgs = [];
      if (player.defenseStage !== dBefore) msgs.push("ぼうぎょが あがった");
      if (healed > 0) msgs.push(`HPが ${healed} かいふくした`);
      scene.enqueueMessage(`${def.name}で ${player.species.name}の ${msgs.join("！ ")}！`);
      itemConsumed = true;
      scene.updateHud(true);
    } else {
      scene.enqueueMessage("しかし これいじょう あがらない！");
    }
  } else if (def.effect.type === "healAllPP") {
    // エーテル・マックスエリクサー: 全技のPPを回復
    const moves = getMonsterMoves(player);
    let ppHealed = false;
    if (moves.length > 0) {
      if (!Array.isArray(player.pp)) player.pp = [];
      moves.forEach((move, i) => {
        const maxPp = move.pp || 10;
        const current = (player.pp[i] !== undefined) ? player.pp[i] : maxPp;
        const restoreAmount = def.effect.amount < 0 ? maxPp : (def.effect.amount || 10);
        const newPp = Math.min(maxPp, current + restoreAmount);
        if (newPp > current) {
          player.pp[i] = newPp;
          ppHealed = true;
        }
      });
    }
    if (ppHealed) {
      audioManager.playHeal();
      scene.enqueueMessage(`${def.name}で ${player.species.name}の わざの PPが かいふくした！`);
      itemConsumed = true;
    } else {
      scene.enqueueMessage("しかし PPは まんたんだ！");
    }
  } else {
    scene.enqueueMessage("しかし なにも おきなかった…");
  }

  if (itemConsumed) {
    entry.quantity = Math.max(0, entry.quantity - 1);
    gameState.inventory = gameState.inventory.filter((it) => it.quantity > 0);
  }

  scene.setBattleState(BattleState.OPPONENT_TURN);
  scene.clearMenuTexts();
  scene.startOpponentTurn();
}
