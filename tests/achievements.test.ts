import { beforeEach, describe, expect, it } from "vitest";
import {
  ACHIEVEMENTS,
  getAchievementById,
  getAchievementHint,
  checkNewAchievements,
} from "../js/data/achievements.ts";
import { gameState } from "../js/state/gameState.ts";

describe("achievements", () => {
  beforeEach(() => {
    gameState.reset();
  });

  it("ジム/四天王系実績の条件判定が進行フラグと一致する", () => {
    const gym2 = getAchievementById("GYM_CLEAR_2");
    const eliteAll = getAchievementById("ELITE_FOUR_ALL");

    expect(gym2?.check()).toBe(false);
    expect(eliteAll?.check()).toBe(false);

    gameState.storyFlags.frozenPeakGymCleared = true;
    gameState.storyFlags.eliteFourWind = true;
    gameState.storyFlags.eliteFourFlame = true;
    gameState.storyFlags.eliteFourTide = true;
    gameState.storyFlags.eliteFourFrost = true;

    expect(gym2?.check()).toBe(true);
    expect(eliteAll?.check()).toBe(true);
  });

  it("ヒントは実績ごとの上書き文言を優先する", () => {
    const def = getAchievementById("LEGENDARY_BEATEN");
    expect(getAchievementHint(def!)).toContain("天空の花園");
  });

  it("新規達成判定は未解除のみを返す", () => {
    gameState.totalBattles = 1;
    const newlyUnlocked = checkNewAchievements(["FIRST_VICTORY"]);
    expect(newlyUnlocked).not.toContain("FIRST_VICTORY");
  });

  it("実績IDの重複がない", () => {
    const ids = ACHIEVEMENTS.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
