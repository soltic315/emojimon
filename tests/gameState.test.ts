import { beforeEach, describe, expect, it } from "vitest";
import { gameState } from "../js/state/gameState.ts";
import { MONSTERS } from "../js/data/monsters.ts";

const SAVE_KEY = "emojimon_save_v2";
const SAVE_BACKUP_KEY = "emojimon_save_v2_backup";

function createLocalStorageMock() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

describe("gameState map weather", () => {
  beforeEach(() => {
    if (!globalThis.localStorage) {
      globalThis.localStorage = createLocalStorageMock();
    }
    globalThis.localStorage.clear();
    gameState.reset();
  });

  it("マップ天候は未設定時のみ生成して以後は再利用する", () => {
    let factoryCallCount = 0;

    const first = gameState.ensureMapWeather("FOREST", () => {
      factoryCallCount += 1;
      return "RAINY";
    });
    const second = gameState.ensureMapWeather("FOREST", () => {
      factoryCallCount += 1;
      return "SUNNY";
    });

    expect(first).toBe("RAINY");
    expect(second).toBe("RAINY");
    expect(factoryCallCount).toBe(1);
  });

  it("戦闘データにマップ天候を自動で引き継ぐ", () => {
    gameState.currentMap = "FOREST";
    gameState.setMapWeather("FOREST", "WINDY");

    gameState.setBattle({
      player: { species: { id: "A" }, currentHp: 10 },
      opponent: { species: { id: "B" }, currentHp: 10 },
    });

    expect(gameState.activeBattle?.weather).toBe("WINDY");
  });

  it("2回目以降のセーブでバックアップを保持する", () => {
    gameState.playerName = "はじめのセーブ";
    expect(gameState.save()).toBe(true);

    gameState.playerName = "2回目セーブ";
    expect(gameState.save()).toBe(true);

    const backupRaw = globalThis.localStorage.getItem(SAVE_BACKUP_KEY);
    expect(backupRaw).toBeTruthy();

    const backupData = JSON.parse(backupRaw || "{}");
    expect(backupData.playerName).toBe("はじめのセーブ");
  });

  it("メインセーブが壊れていてもバックアップからロードできる", () => {
    gameState.playerName = "復旧元データ";
    expect(gameState.save()).toBe(true);

    gameState.playerName = "最新データ";
    expect(gameState.save()).toBe(true);

    globalThis.localStorage.setItem(SAVE_KEY, "{broken-json");

    gameState.playerName = "初期化済み";
    const loaded = gameState.load();

    expect(loaded).toBe(true);
    expect(gameState.playerName).toBe("復旧元データ");
  });

  it("メインセーブのJSON形式は正しくても構造不正ならバックアップからロードできる", () => {
    gameState.playerName = "構造検証の復旧元";
    expect(gameState.save()).toBe(true);

    gameState.playerName = "最新データ";
    expect(gameState.save()).toBe(true);

    globalThis.localStorage.setItem(SAVE_KEY, JSON.stringify({
      playerName: "壊れた構造",
      party: "NOT_ARRAY",
    }));

    gameState.playerName = "初期化済み";
    const loaded = gameState.load();

    expect(loaded).toBe(true);
    expect(gameState.playerName).toBe("構造検証の復旧元");
  });

  it("ロード時にストーリー進行フラグを欠落なく復元する", () => {
    gameState.storyFlags.shadowDataFound = true;
    gameState.storyFlags.libraryPuzzleSolved = true;
    gameState.storyFlags.eliteFourFrost = true;
    gameState.storyFlags.starterSpeciesId = "MON_TEST";

    expect(gameState.save()).toBe(true);

    gameState.storyFlags.shadowDataFound = false;
    gameState.storyFlags.libraryPuzzleSolved = false;
    gameState.storyFlags.eliteFourFrost = false;
    gameState.storyFlags.starterSpeciesId = null;

    const loaded = gameState.load();

    expect(loaded).toBe(true);
    expect(gameState.storyFlags.shadowDataFound).toBe(true);
    expect(gameState.storyFlags.libraryPuzzleSolved).toBe(true);
    expect(gameState.storyFlags.eliteFourFrost).toBe(true);
    expect(gameState.storyFlags.starterSpeciesId).toBe("MON_TEST");
  });

  it("partyが存在してもstoryFlagsの自動補完は行わない", () => {
    const speciesId = "TEST_COMPAT_MON";
    MONSTERS[speciesId] = {
      id: speciesId,
      name: "テストモン",
      primaryType: "NORMAL",
      baseStats: { maxHp: 20, attack: 10, defense: 10, speed: 10 },
      learnset: [],
      learnsetLevels: [],
    };

    globalThis.localStorage.setItem(SAVE_KEY, JSON.stringify({
      playerName: "互換なしロード",
      party: [{ speciesId, level: 5, currentHp: 10, moveIds: [], stamina: 5 }],
      storyFlags: {},
    }));

    const loaded = gameState.load();

    expect(loaded).toBe(true);
    expect(gameState.party.length).toBe(1);
    expect(gameState.storyFlags.starterChosen).toBe(false);
    expect(gameState.storyFlags.prologueDone).toBe(false);
    expect(gameState.storyFlags.introNarrationDone).toBe(false);

    delete MONSTERS[speciesId];
  });

  it("闘技場ラウンド状態をセーブ/ロードで復元できる", () => {
    gameState.arenaRound = 2;
    expect(gameState.save()).toBe(true);

    gameState.arenaRound = 0;
    const loaded = gameState.load();

    expect(loaded).toBe(true);
    expect(gameState.arenaRound).toBe(2);
  });

  it("連勝数は勝利で加算され敗北でリセットされる", () => {
    expect(gameState.updateBattleWinStreak(true)).toBe(1);
    expect(gameState.updateBattleWinStreak(true)).toBe(2);
    expect(gameState.updateBattleWinStreak(false)).toBe(0);
    expect(gameState.battleWinStreak).toBe(0);
  });

  it("実績達成時に報酬が付与され、再チェックで重複付与されない", () => {
    gameState.totalBattles = 1;
    const beforeMoney = gameState.money;
    const beforeEmoBall = gameState.inventory.find((entry) => entry.itemId === "EMO_BALL")?.quantity || 0;

    const firstUnlock = gameState.checkAchievements();
    const afterFirstMoney = gameState.money;
    const afterFirstEmoBall = gameState.inventory.find((entry) => entry.itemId === "EMO_BALL")?.quantity || 0;

    expect(firstUnlock).toContain("FIRST_VICTORY");
    expect(afterFirstMoney).toBeGreaterThan(beforeMoney);
    expect(afterFirstEmoBall).toBeGreaterThan(beforeEmoBall);

    const secondUnlock = gameState.checkAchievements();
    expect(secondUnlock).toHaveLength(0);
    expect(gameState.money).toBe(afterFirstMoney);
    expect(gameState.inventory.find((entry) => entry.itemId === "EMO_BALL")?.quantity || 0).toBe(afterFirstEmoBall);
  });
});
