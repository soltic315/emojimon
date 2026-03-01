import { z } from "zod";

const moveCategorySchema = z.enum(["physical", "special", "status"]);

const moveSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
  power: z.number().min(0).optional(),
  accuracy: z.number().min(0).max(1).optional(),
  category: moveCategorySchema.optional(),
  pp: z.number().int().min(0).optional(),
  description: z.string().optional(),
  priority: z.number().int().optional(),
  selfAttackStage: z.number().int().optional(),
  selfDefenseStage: z.number().int().optional(),
  targetAttackStage: z.number().int().optional(),
  selfHealPercent: z.number().min(0).max(1).optional(),
  inflictStatus: z.string().nullable().optional(),
  statusChance: z.number().min(0).max(1).optional(),
});

const movesDataSchema = z.object({
  moves: z.array(moveSchema),
});

const baseStatsSchema = z.object({
  maxHp: z.number().min(1),
  attack: z.number().min(1),
  defense: z.number().min(1),
  speed: z.number().min(1),
});

const subEmojiSchema = z.object({
  emoji: z.string().min(1),
  point: z.union([
    z.string().min(1),
    z.object({
      x: z.number(),
      y: z.number(),
    }),
  ]).optional(),
  size: z.number().positive().optional(),
});

const monsterSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  emoji: z.string().optional(),
  sub_emoji: z.array(subEmojiSchema),
  primaryType: z.string().min(1),
  baseStats: baseStatsSchema,
  learnset: z.array(z.string().min(1)),
  catchRate: z.number().min(0).max(1),
  description: z.string().optional(),
  abilityId: z.string().optional(),
  evolveTo: z.string().nullable().optional(),
  evolveLevel: z.number().int().positive().nullable().optional(),
});

const monstersDataSchema = z.object({
  monsters: z.array(monsterSchema),
  wildPoolIds: z.array(z.string().min(1)).optional(),
  forestPoolIds: z.array(z.string().min(1)).optional(),
  cavePoolIds: z.array(z.string().min(1)).optional(),
  volcanoPoolIds: z.array(z.string().min(1)).optional(),
  ruinsPoolIds: z.array(z.string().min(1)).optional(),
  gymBoss: z.object({
    id: z.string().min(1),
    level: z.number().int().positive(),
  }).optional(),
});

const itemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  emoji: z.string().optional(),
  description: z.string().optional(),
  battleUsable: z.boolean().optional(),
  price: z.number().min(0).optional(),
  effect: z.union([z.record(z.string(), z.any()), z.null()]).optional(),
  catchBonus: z.number().min(0).optional(),
});

const itemsDataSchema = z.object({
  items: z.array(itemSchema),
});

const abilitiesDataSchema = z.object({
  abilities: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
  })),
});

function formatIssues(label, issues) {
  const headline = `・${label}: ${issues.length}件の不整合`;
  const details = issues.slice(0, 4).map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "root";
    return `  - ${path}: ${issue.message}`;
  });
  return [headline, ...details].join("\n");
}

export function validateGameData(raw) {
  const movesResult = movesDataSchema.safeParse(raw.moves);
  const monstersResult = monstersDataSchema.safeParse(raw.monsters);
  const itemsResult = itemsDataSchema.safeParse(raw.items);
  const abilitiesResult = abilitiesDataSchema.safeParse(raw.abilities);

  const errors = [];
  if (!movesResult.success) errors.push(formatIssues("moves.json", movesResult.error.issues));
  if (!monstersResult.success) errors.push(formatIssues("monsters.json", monstersResult.error.issues));
  if (!itemsResult.success) errors.push(formatIssues("items.json", itemsResult.error.issues));
  if (!abilitiesResult.success) errors.push(formatIssues("abilities.json", abilitiesResult.error.issues));

  if (errors.length > 0) {
    throw new Error(`ゲームデータ検証に失敗しました。\n${errors.join("\n")}`);
  }

  return {
    moves: movesResult.data,
    monsters: monstersResult.data,
    items: itemsResult.data,
    abilities: abilitiesResult.data,
  };
}