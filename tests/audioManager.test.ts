import { describe, expect, it } from "vitest";
import { AudioManager } from "../js/audio/AudioManager.ts";

describe("AudioManager playAreaBgm", () => {
  it("マップキーに応じたBGMキーを解決して再生する", () => {
    const manager = new AudioManager() as any;
    manager._initialized = true;

    const calledKeys: string[] = [];
    manager._playBgm = (key: string) => {
      calledKeys.push(key);
      manager._currentBgm = key;
    };

    manager.playAreaBgm("FOREST");
    manager.playAreaBgm("DARK_TOWER");
    manager.playAreaBgm("FROZEN_PEAK");

    expect(calledKeys).toEqual(["forest", "dark", "ice"]);
  });

  it("同一BGMへの連続切替は重複再生しない", () => {
    const manager = new AudioManager() as any;
    manager._initialized = true;

    const calledKeys: string[] = [];
    manager._playBgm = (key: string) => {
      if (manager._currentBgm === key) return;
      calledKeys.push(key);
      manager._currentBgm = key;
    };

    manager.playAreaBgm("EMOJI_FOREST");
    manager.playAreaBgm("FOREST");

    expect(calledKeys).toEqual(["forest"]);
  });
});
