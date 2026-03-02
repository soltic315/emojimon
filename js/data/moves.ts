export const MOVE_CATEGORY = {
  PHYSICAL: "physical",
  SPECIAL: "special",
  STATUS: "status",
};

export const MOVE_STAMINA_COST_MIN = 1;
export const MOVE_STAMINA_COST_MAX = 9;

export const MOVES = {};

const MOVE_DEFAULTS = Object.freeze({
  power: 0,
  accuracy: 1,
  description: "",
  priority: 0,
  selfAttackStage: 0,
  selfDefenseStage: 0,
  targetAttackStage: 0,
  targetDefenseStage: 0,
  selfHealPercent: 0,
  inflictStatus: null,
  statusChance: 0,
});

function normalizeMoveStaminaCost(value, fallback = 1) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(MOVE_STAMINA_COST_MAX, Math.max(MOVE_STAMINA_COST_MIN, Math.floor(value)));
}

export function getMoveStaminaCost(move) {
  if (!move) return 1;

  if (Number.isFinite(move.staminaCost)) {
    return normalizeMoveStaminaCost(move.staminaCost, 1);
  }

  const legacyPp = Number.isFinite(move.pp) ? Math.max(0, Math.floor(move.pp)) : null;
  if (legacyPp === null) return 1;
  if (legacyPp <= 5) return 3;
  if (legacyPp <= 12) return 2;
  return 1;
}

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
      ...MOVE_DEFAULTS,
      ...raw,
      id: raw.id,
      name: raw.name,
      type: raw.type,
      power: raw.power ?? 0,
      accuracy: raw.accuracy ?? 1,
      category,
      staminaCost: getMoveStaminaCost(raw),
      description: raw.description || "",
    };
  });
}

export function getMoveById(id) {
  return MOVES[id] || null;
}
