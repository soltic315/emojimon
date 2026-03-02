import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearMessageAutoAdvanceEvent,
  enqueueMessage,
  resolveBattleSpeedMultiplier,
  scheduleMessageAutoAdvance,
  showNextMessage,
  updateMessageFastForward,
} from "../js/scenes/battle/battleMessageFlow.ts";
import { gameState } from "../js/state/gameState.ts";
import { BattleState } from "../js/scenes/battle/battleConstants.ts";

describe("battleMessageFlow", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("battleSpeed設定に応じて速度倍率を返す", () => {
    gameState.gameplaySettings.battleSpeed = "NORMAL";
    expect(resolveBattleSpeedMultiplier({} as any)).toBe(1);

    gameState.gameplaySettings.battleSpeed = "FAST";
    expect(resolveBattleSpeedMultiplier({} as any)).toBe(1.3);

    gameState.gameplaySettings.battleSpeed = "TURBO";
    expect(resolveBattleSpeedMultiplier({} as any)).toBe(1.65);
  });

  it("scheduleMessageAutoAdvanceは文字数に応じたディレイで遷移予約する", () => {
    (globalThis as any).Phaser = {
      Math: {
        Clamp: (value: number, min: number, max: number) => Math.min(max, Math.max(min, value)),
      },
    };

    const delayedCall = vi.fn((_delay, callback) => ({ remove: vi.fn(), callback }));
    const scene = {
      autoAdvanceMessagesEnabled: true,
      battleSpeedMultiplier: 1,
      time: { delayedCall },
      currentMessage: { text: "aaa" },
      state: BattleState.PLAYER_TURN,
      showNextMessage: vi.fn(),
      messageAutoAdvanceEvent: null,
    } as any;

    scheduleMessageAutoAdvance(scene, "1234567890");
    expect(delayedCall).toHaveBeenCalledTimes(1);
    const delay = delayedCall.mock.calls[0][0];
    expect(delay).toBeGreaterThanOrEqual(560);
    expect(delay).toBeLessThanOrEqual(1850);
  });

  it("showNextMessageはキューが空なら状態に応じた遷移関数を呼ぶ", () => {
    const scene = {
      messageQueue: [],
      currentMessage: { text: "x" },
      nextIndicator: { setVisible: vi.fn() },
      state: BattleState.OPPONENT_TURN,
      startPlayerTurn: vi.fn(),
      showMainMenu: vi.fn(),
      showMoveMenu: vi.fn(),
      showItemMenu: vi.fn(),
      showSwitchMenu: vi.fn(),
      _renderLearnMoveReplaceMenu: vi.fn(),
      endBattle: vi.fn(),
      messageAutoAdvanceEvent: null,
    } as any;

    showNextMessage(scene);

    expect(scene.currentMessage).toBeNull();
    expect(scene.nextIndicator.setVisible).toHaveBeenCalledWith(false);
    expect(scene.startPlayerTurn).toHaveBeenCalledTimes(1);
  });

  it("enqueueMessageはcurrentMessageが空のとき即座に表示処理を開始する", () => {
    const scene = {
      messageQueue: [],
      currentMessage: null,
      showNextMessage: vi.fn(),
    } as any;

    enqueueMessage(scene, "test");

    expect(scene.messageQueue).toHaveLength(1);
    expect(scene.showNextMessage).toHaveBeenCalledTimes(1);
  });

  it("長押し高速送りはしきい値到達後にshowNextMessageを呼ぶ", () => {
    const scene = {
      currentMessage: { text: "test" },
      state: BattleState.PLAYER_TURN,
      keys: { Z: { isDown: true }, ENTER: { isDown: false }, SPACE: { isDown: false } },
      touchControls: { visible: false, isConfirmHeld: () => false },
      messageFastForwardHoldMs: 0,
      messageFastForwardCooldownMs: 0,
      showNextMessage: vi.fn(),
      messageAutoAdvanceEvent: null,
    } as any;

    updateMessageFastForward(scene, 230);

    expect(scene.showNextMessage).toHaveBeenCalledTimes(1);
    expect(scene.messageFastForwardCooldownMs).toBe(65);
  });

  it("clearMessageAutoAdvanceEventはイベントを解除してnull化する", () => {
    const remove = vi.fn();
    const scene = {
      messageAutoAdvanceEvent: { remove },
    } as any;

    clearMessageAutoAdvanceEvent(scene);

    expect(remove).toHaveBeenCalledWith(false);
    expect(scene.messageAutoAdvanceEvent).toBeNull();
  });
});
