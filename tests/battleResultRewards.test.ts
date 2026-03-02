import { afterEach, describe, expect, it, vi } from "vitest";
import { grantHeldItemDrops, processVictoryRewards } from "../js/scenes/battle/battleResultRewards.ts";
import { gameState } from "../js/state/gameState.ts";
import { EXP_MULT_TRAINER, SHARED_EXP_RATIO } from "../js/scenes/battle/battleConstants.ts";

describe("grantHeldItemDrops", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("dropRate未定義のheldItemはドロップしない", () => {
    const addItemSpy = vi.spyOn(gameState, "addItem").mockImplementation(() => {});
    const enqueueMessage = vi.fn();

    grantHeldItemDrops(
      { enqueueMessage },
      {
        species: {
          name: "テストモン",
          heldItems: [{ itemId: "POTION" }],
        },
      },
    );

    expect(addItemSpy).not.toHaveBeenCalled();
    expect(enqueueMessage).not.toHaveBeenCalled();
  });

  it("有効なdropRateなら確率判定に成功したときのみドロップする", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const addItemSpy = vi.spyOn(gameState, "addItem").mockImplementation(() => {});
    const enqueueMessage = vi.fn();

    grantHeldItemDrops(
      { enqueueMessage },
      {
        species: {
          name: "テストモン",
          heldItems: [{ itemId: "POTION", dropRate: 1 }],
        },
      },
    );

    expect(addItemSpy).toHaveBeenCalledWith("POTION", 1);
    expect(enqueueMessage).toHaveBeenCalledTimes(1);
  });
});

describe("processVictoryRewards", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    gameState.reset();
  });

  it("経験値をリーダーと生存メンバーへ分配し、所持金を加算する", () => {
    const leader = {
      species: { id: "LEADER", name: "リーダー", baseExpYield: 40 },
      level: 10,
      currentHp: 50,
      nextLevelExp: 100,
      exp: 10,
      moveIds: [],
    } as any;
    const allyAlive = {
      species: { id: "ALLY", name: "アリー" },
      level: 8,
      currentHp: 30,
    } as any;
    const allyFainted = {
      species: { id: "ALLY2", name: "ダウン" },
      level: 8,
      currentHp: 0,
    } as any;
    gameState.party = [leader, allyAlive, allyFainted] as any;

    const scene = {
      isArena: false,
      isBoss: false,
      isTrainer: true,
      isWildBattle: false,
      enqueueMessage: vi.fn(),
      _startLearnMoveSelection: vi.fn(),
      _playLevelUpEffect: vi.fn(),
      _playEvolutionEffect: vi.fn(),
      playerEmojiText: {},
    } as any;

    const addExpDetailedSpy = vi.spyOn(gameState, "addExpToMonsterDetailed").mockReturnValue({
      levelsGained: 0,
      learnedMoves: [],
    });
    const addExpSpy = vi.spyOn(gameState, "addExpToMonster").mockReturnValue(0);
    const addBondSpy = vi.spyOn(gameState, "addBond").mockImplementation(() => {});
    const addMoneySpy = vi.spyOn(gameState, "addMoney").mockImplementation(() => {});

    const opponent = {
      species: { id: "OPP", name: "テスト敵", baseExpYield: 50 },
      level: 12,
      rewardMultiplier: 1,
    } as any;

    processVictoryRewards(scene, opponent, leader);

    const expectedExp = Math.max(1, Math.floor(50 * (12 / 5) * EXP_MULT_TRAINER));
    const expectedShare = Math.max(1, Math.floor(expectedExp * SHARED_EXP_RATIO));
    expect(addExpDetailedSpy).toHaveBeenCalledWith(leader, expectedExp);
    expect(addExpSpy).toHaveBeenCalledWith(allyAlive, expectedShare);
    expect(addExpSpy).toHaveBeenCalledTimes(1);
    expect(addBondSpy).toHaveBeenCalledWith(leader, 2);
    expect(addBondSpy).toHaveBeenCalledWith(allyAlive, 1);
    expect(addMoneySpy).toHaveBeenCalledWith(120);
  });

  it("未登録の相手はseenIdsへ追加される", () => {
    const leader = {
      species: { id: "LEADER", name: "リーダー", baseExpYield: 30 },
      level: 8,
      currentHp: 40,
      nextLevelExp: 100,
      exp: 0,
      moveIds: [],
    } as any;
    gameState.party = [leader] as any;
    gameState.seenIds = [];

    vi.spyOn(gameState, "addExpToMonsterDetailed").mockReturnValue({ levelsGained: 0, learnedMoves: [] });
    vi.spyOn(gameState, "addBond").mockImplementation(() => {});
    vi.spyOn(gameState, "addMoney").mockImplementation(() => {});

    const scene = {
      isArena: false,
      isBoss: false,
      isTrainer: false,
      isWildBattle: true,
      enqueueMessage: vi.fn(),
      _startLearnMoveSelection: vi.fn(),
      _playLevelUpEffect: vi.fn(),
      _playEvolutionEffect: vi.fn(),
      playerEmojiText: {},
    } as any;

    const opponent = {
      species: { id: "NEW_MON", name: "しんき", baseExpYield: 20 },
      level: 6,
    } as any;

    processVictoryRewards(scene, opponent, leader);
    expect(gameState.seenIds).toContain("NEW_MON");
  });
});
