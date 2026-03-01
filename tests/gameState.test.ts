import { beforeEach, describe, expect, it } from "vitest";
import { gameState } from "../js/state/gameState.ts";

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
});
