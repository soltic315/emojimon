import { describe, expect, it } from "vitest";
import { DEFAULT_STORY_FLAGS, STORY_FLAG_KEYS, sanitizeStoryFlags } from "../js/state/storyFlags.ts";

describe("storyFlags", () => {
  it("STORY_FLAG_KEYSは既定フラグキーと一致する", () => {
    expect(new Set(STORY_FLAG_KEYS)).toEqual(new Set(Object.keys(DEFAULT_STORY_FLAGS)));
  });

  it("sanitizeStoryFlagsは未知キーを無視し既定キーのみを返す", () => {
    const sanitized = sanitizeStoryFlags({
      prologueDone: true,
      unknownFlag: true,
      starterSpeciesId: "MON_TEST",
    });

    expect(sanitized.prologueDone).toBe(true);
    expect((sanitized as Record<string, unknown>).unknownFlag).toBeUndefined();
    expect(sanitized.starterSpeciesId).toBe("MON_TEST");
  });
});
