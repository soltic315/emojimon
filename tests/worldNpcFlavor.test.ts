import { describe, expect, it } from "vitest";
import { enhanceMapNpcs, pickNpcDialogLine, resolveNpcSpeakerLabel } from "../js/scenes/world/worldNpcFlavor.ts";

describe("worldNpcFlavor", () => {
  it("通常NPCに顔絵文字と会話プールと移動設定を付与する", () => {
    const [npc] = enhanceMapNpcs("EMOJI_TOWN", [
      { x: 6, y: 7, text: "こんにちは！" },
    ]);

    expect(typeof npc.face).toBe("string");
    expect(npc.face.length).toBeGreaterThan(0);
    expect(Array.isArray(npc.dialogPool)).toBe(true);
    expect(npc.dialogPool.length).toBeGreaterThan(1);
    expect(npc.canWander).toBe(true);
    expect(npc.wanderRadius).toBeGreaterThan(0);
  });

  it("ショップNPCはデフォルトで移動しない", () => {
    const [npc] = enhanceMapNpcs("TOWN_SHOP", [
      { x: 6, y: 4, text: "いらっしゃいませ", shop: true },
    ]);

    expect(npc.canWander).toBe(false);
    expect(npc.wanderRadius).toBe(0);
  });

  it("会話抽選はdialogPoolから選ばれる", () => {
    const npc = {
      x: 1,
      y: 1,
      dialogPool: ["A", "B", "C"],
      text: "fallback",
    };
    expect(pickNpcDialogLine(npc, () => 0)).toBe("A");
    expect(pickNpcDialogLine(npc, () => 0.49)).toBe("B");
    expect(pickNpcDialogLine(npc, () => 0.99)).toBe("C");
  });

  it("話者ラベルは顔絵文字付きで解決される", () => {
    const label = resolveNpcSpeakerLabel({ speakerName: "町のひと", face: "🙂" });
    expect(label).toBe("町のひと 🙂");
  });

  it("博士はシナリオ状態に関係なく同じ絵文字で表示される", () => {
    const [professorWithStory] = enhanceMapNpcs("LAB", [
      { x: 7, y: 2, story: "professor_prologue" },
    ]);
    const [professorAfterPrologue] = enhanceMapNpcs("LAB", [
      { x: 7, y: 2, text: "旅の調子はどうだい？" },
    ]);

    expect(professorWithStory.face).toBe("🧑‍🔬");
    expect(professorAfterPrologue.face).toBe("🧑‍🔬");
  });

  it("ユニークNPCは同一識別子で安定した絵文字になる", () => {
    const [first] = enhanceMapNpcs("FOREST", [
      { x: 9, y: 8, rivalBattle: "forest_scout", trainerName: "レンジャー ミナト" },
    ]);
    const [second] = enhanceMapNpcs("FOREST", [
      { x: 9, y: 8, rivalBattle: "forest_scout", trainerName: "レンジャー ミナト", text: "再戦だ！" },
    ]);

    expect(first.face).toBe(second.face);
  });
});
