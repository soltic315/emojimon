import { describe, expect, it } from "vitest";
import { BattleState } from "../js/scenes/battle/battleConstants.ts";
import {
  createBattleStateActor,
  transitionBattleState,
} from "../js/scenes/battle/battleStateMachine.ts";

describe("battleStateMachine", () => {
  it("初期状態をINTROで開始する", () => {
    const actor = createBattleStateActor();
    expect(actor.getSnapshot().value).toBe(BattleState.INTRO);
    actor.stop();
  });

  it("任意のバトル状態へ遷移できる", () => {
    const actor = createBattleStateActor();
    const targets = [
      BattleState.PLAYER_TURN,
      BattleState.PLAYER_SELECT_MOVE,
      BattleState.PLAYER_SELECT_ITEM,
      BattleState.PLAYER_SELECT_SWITCH,
      BattleState.PLAYER_SELECT_LEARN_REPLACE,
      BattleState.OPPONENT_TURN,
      BattleState.ANIMATING,
      BattleState.RESULT,
      BattleState.INTRO,
    ];

    targets.forEach((nextState) => {
      const current = transitionBattleState(actor, nextState);
      expect(current).toBe(nextState);
    });

    actor.stop();
  });

  it("未知の状態を指定した場合はエラーになる", () => {
    const actor = createBattleStateActor();
    expect(() => transitionBattleState(actor, "UNKNOWN_STATE")).toThrowError(/未知のバトル状態/);
    actor.stop();
  });
});
