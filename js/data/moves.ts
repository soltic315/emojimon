export const MOVE_CATEGORY = {
  PHYSICAL: "physical",
  SPECIAL: "special",
  STATUS: "status",
};

export const MOVES = {};

export function initMovesFromJson(json) {
  if (!json || !Array.isArray(json.moves)) return;

  Object.keys(MOVES).forEach((key) => {
    delete MOVES[key];
  });

  json.moves.forEach((raw) => {
    const categoryValues = Object.values(MOVE_CATEGORY);
    const category = categoryValues.includes(raw.category)
      ? raw.category
      : MOVE_CATEGORY.PHYSICAL;

    MOVES[raw.id] = {
      id: raw.id,
      name: raw.name,
      type: raw.type,
      power: raw.power ?? 0,
      accuracy: raw.accuracy ?? 1,
      category,
      pp: raw.pp ?? 10,
      description: raw.description || "",
      priority: raw.priority ?? 0,
      selfAttackStage: raw.selfAttackStage ?? 0,
      selfDefenseStage: raw.selfDefenseStage ?? 0,
      targetAttackStage: raw.targetAttackStage ?? 0,
      selfHealPercent: raw.selfHealPercent ?? 0,
      inflictStatus: raw.inflictStatus ?? null,
      statusChance: raw.statusChance ?? 0,
    };
  });
}

export function getMoveById(id) {
  return MOVES[id] || null;
}
