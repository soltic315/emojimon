/**
 * モンスター進化ロジック
 * レベル進化・アイテム進化の判定と実行
 */
import { MONSTERS, calcStats, syncMonsterMoves } from "./monsters.ts";

/** 進化チェック: レベル進化が可能な場合は進化後のspeciesを返す */
export function checkEvolution(monsterEntry) {
  if (!monsterEntry || !monsterEntry.species) return null;
  const species = monsterEntry.species;
  if (!species.evolution) return null;
  const { evolvesTo, condition } = species.evolution;
  if (condition.type === "LEVEL" && typeof condition.value === "number") {
    if (monsterEntry.level >= condition.value) {
      const evolved = MONSTERS[evolvesTo];
      if (evolved) return evolved;
    }
  }
  return null;
}

/** アイテム進化チェック: 指定アイテムで進化可能な場合は進化後のspeciesを返す */
export function checkItemEvolution(monsterEntry, itemId) {
  if (!monsterEntry || !monsterEntry.species || !itemId) return null;
  const species = monsterEntry.species;
  if (!species.evolution) return null;
  const { evolvesTo, condition } = species.evolution;
  if (condition.type === "ITEM" && condition.value === itemId) {
    const evolved = MONSTERS[evolvesTo];
    if (evolved) return evolved;
  }
  return null;
}

/** 進化を実行する */
export function evolveMonster(monsterEntry, newSpecies) {
  const oldName = monsterEntry.species.name;
  monsterEntry.species = newSpecies;
  // 進化後のHP全回復
  const newStats = calcStats(newSpecies, monsterEntry.level);
  monsterEntry.currentHp = newStats.maxHp;
  syncMonsterMoves(monsterEntry);
  return oldName;
}
