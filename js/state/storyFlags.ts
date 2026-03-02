/**
 * ストーリーフラグの初期値定義とサニタイズ
 */

export const DEFAULT_STORY_FLAGS = Object.freeze({
  prologueDone: false,
  starterChosen: false,
  rivalIntroDone: false,
  townRivalBeaten: false,
  forestCrystalFound: false,
  forestRivalBeaten: false,
  caveEvilBeaten: false,
  caveRivalBeaten3: false,
  darkTowerGruntBeaten: false,
  darkTowerVoidBeaten: false,
  volcanoEvilBossBeaten: false,
  frozenPeakGymCleared: false,
  frozenPeakRivalBeaten: false,
  frozenPeakIceQuest: false,
  ruinsFinalDone: false,
  legendaryDefeated: false,
  forestScoutBeaten: false,
  caveScholarBeaten: false,
  darkTowerSentinelBeaten: false,
  volcanicScoutBeaten: false,
  frozenSageBeaten: false,
  ruinsGuardianBeaten: false,
  starterSpeciesId: null,
  forestSwimTreasureTaken: false,
  caveHiddenItemFound: false,
  swampRangerBeaten: false,
  swampEvilBeaten: false,
  swampHerbFound: false,
  coralDiverBeaten: false,
  coralWaterQuest: false,
  coralPearlFound: false,
  desertNomadBeaten: false,
  desertRivalBeaten: false,
  desertRelicFound: false,
  shadowBeastBeaten: false,
  shadowLabFound: false,
  shadowDataFound: false,
  libraryScholarBeaten: false,
  libraryPuzzleSolved: false,
  eliteFourWind: false,
  eliteFourFlame: false,
  eliteFourTide: false,
  eliteFourFrost: false,
  basinFinalRival: false,
  basinStarFound: false,
  introNarrationDone: false,
  tutorialMoveDone: false,
  tutorialBattleDone: false,
  tutorialCatchDone: false,
  tutorialMenuDone: false,
  momFarewellDone: false,
  swampTabletRead: false,
  coralLegendRead: false,
  desertObeliskRead: false,
  shadowMemoryRead: false,
  libraryCodexRead: false,
  basinLoreRead: false,
  swampRemedyQuestDone: false,
  coralArchivistQuestDone: false,
  libraryRestorationQuestDone: false,
  starResearchQuestDone: false,
  forestDeepSeedFound: false,
  caveEchoStoneFound: false,
  volcanoCoreShardFound: false,
  frozenGlacierHerbFound: false,
  librarySecretArchiveFound: false,
  gardenSkydewFound: false,
  basinMeteorShardFound: false,
});

export function createDefaultStoryFlags() {
  return { ...DEFAULT_STORY_FLAGS };
}

export function sanitizeStoryFlags(raw) {
  const sanitized = createDefaultStoryFlags();
  if (!raw || typeof raw !== "object") return sanitized;

  Object.keys(sanitized).forEach((key) => {
    if (key === "starterSpeciesId") {
      const starterSpeciesId = raw[key];
      sanitized.starterSpeciesId = typeof starterSpeciesId === "string" && starterSpeciesId.length > 0
        ? starterSpeciesId
        : null;
      return;
    }
    sanitized[key] = !!raw[key];
  });

  return sanitized;
}
