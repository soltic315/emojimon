import { afterEach, describe, expect, it, vi } from "vitest";
import { grantHeldItemDrops } from "../js/scenes/battle/battleResultRewards.ts";
import { gameState } from "../js/state/gameState.ts";

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
