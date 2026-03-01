import { createActor, createMachine } from "xstate";
import { BattleState } from "./battleConstants.ts";

const VALID_BATTLE_STATES = [
  BattleState.INTRO,
  BattleState.PLAYER_TURN,
  BattleState.PLAYER_SELECT_MOVE,
  BattleState.PLAYER_SELECT_LEARN_REPLACE,
  BattleState.PLAYER_SELECT_ITEM,
  BattleState.PLAYER_SELECT_SWITCH,
  BattleState.OPPONENT_TURN,
  BattleState.ANIMATING,
  BattleState.RESULT,
];

const TO_STATE_EVENT = {
  [BattleState.INTRO]: "TO_INTRO",
  [BattleState.PLAYER_TURN]: "TO_PLAYER_TURN",
  [BattleState.PLAYER_SELECT_MOVE]: "TO_PLAYER_SELECT_MOVE",
  [BattleState.PLAYER_SELECT_LEARN_REPLACE]: "TO_PLAYER_SELECT_LEARN_REPLACE",
  [BattleState.PLAYER_SELECT_ITEM]: "TO_PLAYER_SELECT_ITEM",
  [BattleState.PLAYER_SELECT_SWITCH]: "TO_PLAYER_SELECT_SWITCH",
  [BattleState.OPPONENT_TURN]: "TO_OPPONENT_TURN",
  [BattleState.ANIMATING]: "TO_ANIMATING",
  [BattleState.RESULT]: "TO_RESULT",
};

const battleStateMachine = createMachine({
  id: "battle-state-machine",
  initial: BattleState.INTRO,
  states: {
    [BattleState.INTRO]: {},
    [BattleState.PLAYER_TURN]: {},
    [BattleState.PLAYER_SELECT_MOVE]: {},
    [BattleState.PLAYER_SELECT_LEARN_REPLACE]: {},
    [BattleState.PLAYER_SELECT_ITEM]: {},
    [BattleState.PLAYER_SELECT_SWITCH]: {},
    [BattleState.OPPONENT_TURN]: {},
    [BattleState.ANIMATING]: {},
    [BattleState.RESULT]: {},
  },
  on: {
    TO_INTRO: { target: `.${BattleState.INTRO}` },
    TO_PLAYER_TURN: { target: `.${BattleState.PLAYER_TURN}` },
    TO_PLAYER_SELECT_MOVE: { target: `.${BattleState.PLAYER_SELECT_MOVE}` },
    TO_PLAYER_SELECT_LEARN_REPLACE: { target: `.${BattleState.PLAYER_SELECT_LEARN_REPLACE}` },
    TO_PLAYER_SELECT_ITEM: { target: `.${BattleState.PLAYER_SELECT_ITEM}` },
    TO_PLAYER_SELECT_SWITCH: { target: `.${BattleState.PLAYER_SELECT_SWITCH}` },
    TO_OPPONENT_TURN: { target: `.${BattleState.OPPONENT_TURN}` },
    TO_ANIMATING: { target: `.${BattleState.ANIMATING}` },
    TO_RESULT: { target: `.${BattleState.RESULT}` },
  },
});

function ensureBattleState(nextState: string) {
  if (!VALID_BATTLE_STATES.includes(nextState)) {
    throw new Error(`未知のバトル状態です: ${nextState}`);
  }
}

function stateToEvent(nextState: string) {
  ensureBattleState(nextState);
  return TO_STATE_EVENT[nextState];
}

export function createBattleStateActor(initialState: string = BattleState.INTRO) {
  ensureBattleState(initialState);
  const actor = createActor(battleStateMachine);
  actor.start();
  if (initialState !== BattleState.INTRO) {
    actor.send({ type: stateToEvent(initialState) });
  }
  return actor;
}

export function transitionBattleState(actor: ReturnType<typeof createBattleStateActor>, nextState: string) {
  const eventType = stateToEvent(nextState);
  actor.send({ type: eventType });
  return actor.getSnapshot().value;
}
