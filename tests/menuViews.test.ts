import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  party: vi.fn(),
  box: vi.fn(),
  boxSwap: vi.fn(),
  bag: vi.fn(),
  bagTarget: vi.fn(),
  pokedex: vi.fn(),
  achievements: vi.fn(),
  trainer: vi.fn(),
  quest: vi.fn(),
  globalMap: vi.fn(),
  guideToc: vi.fn(),
  guide: vi.fn(),
  settings: vi.fn(),
  detachSettings: vi.fn(),
}));

vi.mock("../js/scenes/menu/views/partyView.ts", () => ({
  renderPartyView: mocks.party,
  showPartyMessage: vi.fn(),
}));
vi.mock("../js/scenes/menu/views/boxView.ts", () => ({
  renderBoxView: mocks.box,
  renderBoxSwapView: mocks.boxSwap,
  showBoxMessage: vi.fn(),
}));
vi.mock("../js/scenes/menu/views/bagView.ts", () => ({
  renderBagView: mocks.bag,
  renderBagTargetView: mocks.bagTarget,
  showBagMessage: vi.fn(),
}));
vi.mock("../js/scenes/menu/views/pokedexView.ts", () => ({ renderPokedexView: mocks.pokedex }));
vi.mock("../js/scenes/menu/views/achievementsView.ts", () => ({ renderAchievementsView: mocks.achievements }));
vi.mock("../js/scenes/menu/views/trainerView.ts", () => ({ renderTrainerView: mocks.trainer }));
vi.mock("../js/scenes/menu/views/questView.ts", () => ({ renderQuestView: mocks.quest }));
vi.mock("../js/scenes/menu/views/globalMapView.ts", () => ({ renderGlobalMapView: mocks.globalMap }));
vi.mock("../js/scenes/menu/views/guideView.ts", () => ({
  renderGuideTocView: mocks.guideToc,
  renderGuideView: mocks.guide,
}));
vi.mock("../js/scenes/menu/views/settingsView.ts", () => ({
  renderSettingsView: mocks.settings,
  detachSettingsKeyHandlers: mocks.detachSettings,
}));

import { renderMainMenu, renderSubMenu } from "../js/scenes/menu/menuViews.ts";

function createMockScene() {
  const graphicsObject = {
    fillStyle: () => graphicsObject,
    fillRoundedRect: () => graphicsObject,
    lineStyle: () => graphicsObject,
    lineBetween: () => graphicsObject,
    strokeRoundedRect: () => graphicsObject,
    fillRect: () => graphicsObject,
  };

  return {
    menuIndex: 0,
    subMenuType: "party",
    scale: { width: 1280, height: 720 },
    menuPanel: { removeAll: vi.fn(), add: vi.fn() },
    subPanel: { removeAll: vi.fn(), add: vi.fn() },
    add: {
      graphics: () => graphicsObject,
      text: () => ({
        setOrigin: () => ({ setDepth: () => null }),
        setColor: () => null,
        setFontSize: () => null,
        setText: () => null,
        text: "",
      }),
    },
    rexUI: {
      add: {
        roundRectangle: () => ({ setStrokeStyle: () => ({}) }),
      },
    },
  } as any;
}

describe("menuViews smoke", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((fn) => fn.mockReset());
  });

  it("メインメニューを描画しても例外が発生しない", () => {
    const scene = createMockScene();
    expect(() => renderMainMenu(scene)).not.toThrow();
  });

  it("サブメニューの主要ビューへディスパッチできる", () => {
    const scene = createMockScene();

    scene.subMenuType = "party";
    renderSubMenu(scene);
    expect(mocks.party).toHaveBeenCalled();

    scene.subMenuType = "bag";
    renderSubMenu(scene);
    expect(mocks.bag).toHaveBeenCalled();

    scene.subMenuType = "pokedex";
    renderSubMenu(scene);
    expect(mocks.pokedex).toHaveBeenCalled();

    scene.subMenuType = "trainer";
    renderSubMenu(scene);
    expect(mocks.trainer).toHaveBeenCalled();

    scene.subMenuType = "settings";
    renderSubMenu(scene);
    expect(mocks.settings).toHaveBeenCalled();
  });
});
