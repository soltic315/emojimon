import { beforeEach, describe, expect, it } from "vitest";
import { performUseItem } from "../js/scenes/battle/battleItems.ts";
import { gameState } from "../js/state/gameState.ts";
import { BattleState, StatusCondition } from "../js/scenes/battle/battleConstants.ts";

function createPlayer() {
  return {
    species: {
      id: "TESTMON",
      name: "テストモン",
      baseStats: {
        maxHp: 100,
        attack: 40,
        defense: 40,
        speed: 40,
      },
      primaryType: "NORMAL",
      learnset: [],
      learnsetLevels: [],
    },
    level: 10,
    currentHp: 30,
    statusCondition: StatusCondition.NONE,
    attackStage: 0,
    defenseStage: 0,
    speedStage: 0,
    stamina: 2,
    moveIds: ["TACKLE"],
  };
}

function createScene(player: any, itemDef: any, entry = { itemId: itemDef.id, quantity: 1 }) {
  const messages: string[] = [];
  let nextState: string | null = null;
  let opponentTurnStarted = false;

  const scene = {
    currentBattleItems: [{ entry, def: itemDef }],
    selectedItemIndex: 0,
    isWildBattle: true,
    getActivePlayer: () => player,
    attemptCatch: () => {
      messages.push("catch-attempt");
    },
    enqueueMessage: (message: string) => {
      messages.push(message);
    },
    showMainMenu: () => {
      messages.push("show-main-menu");
    },
    startOpponentTurn: () => {
      opponentTurnStarted = true;
    },
    updateHud: () => {},
    clampStage: (value: number) => Math.max(-6, Math.min(6, value)),
    getStatusLabel: () => "どく",
    setBattleState: (state: string) => {
      nextState = state;
    },
    clearMenuTexts: () => {},
    _state: {
      get messages() {
        return messages;
      },
      get nextState() {
        return nextState;
      },
      get opponentTurnStarted() {
        return opponentTurnStarted;
      },
    },
  };

  return scene as any;
}

describe("battleItems", () => {
  beforeEach(() => {
    gameState.reset();
    gameState.inventory = [];
    gameState.party = [];
  });

  it("HP回復アイテムは回復量を適用し在庫を消費する", () => {
    const player = createPlayer();
    const entry = { itemId: "POTION", quantity: 1 };
    gameState.inventory = [entry];

    const scene = createScene(player, {
      id: "POTION",
      name: "ポーション",
      effect: { type: "heal", amount: 20 },
    }, entry);

    performUseItem(scene);

    expect(player.currentHp).toBe(50);
    expect(gameState.inventory.length).toBe(0);
    expect(scene._state.nextState).toBe(BattleState.OPPONENT_TURN);
    expect(scene._state.opponentTurnStarted).toBe(true);
  });

  it("状態異常回復アイテムは一致する状態のみ治療する", () => {
    const player = createPlayer();
    player.statusCondition = StatusCondition.POISON;
    const entry = { itemId: "ANTIDOTE", quantity: 1 };
    gameState.inventory = [entry];

    const scene = createScene(player, {
      id: "ANTIDOTE",
      name: "どくけし",
      effect: { type: "cureStatus", status: StatusCondition.POISON },
    }, entry);

    performUseItem(scene);

    expect(player.statusCondition).toBe(StatusCondition.NONE);
    expect(gameState.inventory.length).toBe(0);
  });

  it("捕獲ボールはattemptCatchへ委譲する", () => {
    const player = createPlayer();
    const entry = { itemId: "EMO_BALL", quantity: 3 };
    gameState.inventory = [entry];

    const scene = createScene(player, {
      id: "EMO_BALL",
      name: "エモボール",
      catchBonus: 1,
      effect: null,
    }, entry);

    performUseItem(scene);

    expect(scene._state.messages).toContain("catch-attempt");
    expect(entry.quantity).toBe(3);
  });
});
