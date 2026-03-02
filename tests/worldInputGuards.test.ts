import { describe, expect, it } from "vitest";
import { canInteractInWorld, canOpenWorldMenu, isWorldProgressLocked } from "../js/scenes/world/worldInputGuards.ts";

describe("worldInputGuards", () => {
  it("dialog/choice/battlePending中は進行入力をロックする", () => {
    expect(isWorldProgressLocked({ _dialogActive: true })).toBe(true);
    expect(isWorldProgressLocked({ _starterChoiceActive: true })).toBe(true);
    expect(isWorldProgressLocked({ _trainerBattlePending: true })).toBe(true);
  });

  it("入力ロック中は会話開始できない", () => {
    expect(canInteractInWorld({ _dialogActive: true })).toBe(false);
    expect(canInteractInWorld({ _starterChoiceActive: true })).toBe(false);
    expect(canInteractInWorld({ _trainerBattlePending: true })).toBe(false);
  });

  it("入力ロック中はメニューを開けない", () => {
    expect(canOpenWorldMenu({ _dialogActive: true })).toBe(false);
    expect(canOpenWorldMenu({ _starterChoiceActive: true })).toBe(false);
    expect(canOpenWorldMenu({ _trainerBattlePending: true })).toBe(false);
  });

  it("通常時のみ会話開始とメニュー起動を許可する", () => {
    const normal = {
      isMoving: false,
      shopActive: false,
      isEncounterTransitioning: false,
      _dialogActive: false,
      _starterChoiceActive: false,
      _trainerBattlePending: false,
    };
    expect(canInteractInWorld(normal)).toBe(true);
    expect(canOpenWorldMenu(normal)).toBe(true);
  });
});
