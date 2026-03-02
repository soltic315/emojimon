import { z } from "zod";

const moveCategorySchema = z.enum(["physical", "special", "status"]);

const moveSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
  power: z.number().min(0).optional(),
  accuracy: z.number().min(0).max(1).optional(),
  category: moveCategorySchema.optional(),
  staminaCost: z.number().int().min(1).max(9).optional(),
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

const learnsetEntrySchema = z.object({
  move: z.string().min(1),
  level: z.number().int().min(1),
});

const abilityEntrySchema = z.object({
  abilityId: z.string().min(1),
  acquisitionRate: z.number().positive(),
});

const recipeMonsterSchema = z.object({
  monsterId: z.string().min(1),
});

const recipePairSchema = z.tuple([recipeMonsterSchema, recipeMonsterSchema]);

const heldItemSchema = z.object({
  itemId: z.string().min(1),
  dropRate: z.number().min(0).max(1),
});

const evolutionConditionSchema = z.object({
  type: z.enum(["LEVEL", "ITEM"]),
  value: z.union([z.number().int().positive(), z.string().min(1)]),
});

const evolutionSchema = z.object({
  evolvesTo: z.string().min(1),
  condition: evolutionConditionSchema,
});

const monsterSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  emoji: z.string().optional(),
  sub_emoji: z.array(subEmojiSchema),
  primaryType: z.string().min(1),
  secondaryType: z.string().nullable().optional(),
  baseStats: baseStatsSchema,
  learnset: z.array(learnsetEntrySchema),
  catchRate: z.number().min(0).max(1),
  spawnRate: z.number().positive().optional(),
  baseExpYield: z.number().int().positive(),
  heldItems: z.array(heldItemSchema),
  sizeScale: z.number().positive(),
  description: z.string().optional(),
  ability: z.array(abilityEntrySchema).min(1),
  recipe: z.array(recipePairSchema).optional(),
  evolution: evolutionSchema.nullable().optional(),
});

const monstersDataSchema = z.object({
  monsters: z.array(monsterSchema),
  wildPoolIds: z.array(z.string().min(1)).optional(),
  forestPoolIds: z.array(z.string().min(1)).optional(),
  cavePoolIds: z.array(z.string().min(1)).optional(),
  volcanoPoolIds: z.array(z.string().min(1)).optional(),
  ruinsPoolIds: z.array(z.string().min(1)).optional(),
  darkTowerPoolIds: z.array(z.string().min(1)).optional(),
  frozenPeakPoolIds: z.array(z.string().min(1)).optional(),
  gardenPoolIds: z.array(z.string().min(1)).optional(),
  swampPoolIds: z.array(z.string().min(1)).optional(),
  coralPoolIds: z.array(z.string().min(1)).optional(),
  sandValleyPoolIds: z.array(z.string().min(1)).optional(),
  shadowGrovePoolIds: z.array(z.string().min(1)).optional(),
  libraryPoolIds: z.array(z.string().min(1)).optional(),
  basinPoolIds: z.array(z.string().min(1)).optional(),
  gymBoss: z.object({
    id: z.string().min(1),
    level: z.number().int().positive(),
  }).optional(),
  gymBoss2: z.object({
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

function collectDuplicateIdErrors(label, ids) {
  const seen = new Set();
  const duplicated = new Set();

  ids.forEach((id) => {
    if (seen.has(id)) {
      duplicated.add(id);
      return;
    }
    seen.add(id);
  });

  return [...duplicated].map((id) => `・${label}: ID "${id}" が重複しています`);
}

function collectReferenceIntegrityErrors(validated) {
  const errors = [];
  const moves = validated.moves.moves;
  const monsters = validated.monsters.monsters;
  const items = validated.items.items;
  const abilities = validated.abilities.abilities;

  const moveIdSet = new Set(moves.map((move) => move.id));
  const monsterIdSet = new Set(monsters.map((monster) => monster.id));
  const itemIdSet = new Set(items.map((item) => item.id));
  const abilityIdSet = new Set(abilities.map((ability) => ability.id));

  errors.push(...collectDuplicateIdErrors("moves.json", moves.map((move) => move.id)));
  errors.push(...collectDuplicateIdErrors("monsters.json", monsters.map((monster) => monster.id)));
  errors.push(...collectDuplicateIdErrors("items.json", items.map((item) => item.id)));
  errors.push(...collectDuplicateIdErrors("abilities.json", abilities.map((ability) => ability.id)));

  monsters.forEach((monster, monsterIndex) => {
    monster.learnset.forEach((entry, learnsetIndex) => {
      if (!moveIdSet.has(entry.move)) {
        errors.push(`・monsters.json: monsters[${monsterIndex}].learnset[${learnsetIndex}].move "${entry.move}" が moves.json に存在しません`);
      }
    });

    monster.ability.forEach((entry, abilityIndex) => {
      if (!abilityIdSet.has(entry.abilityId)) {
        errors.push(`・monsters.json: monsters[${monsterIndex}].ability[${abilityIndex}].abilityId "${entry.abilityId}" が abilities.json に存在しません`);
      }
    });

    monster.heldItems.forEach((entry, heldItemIndex) => {
      if (!itemIdSet.has(entry.itemId)) {
        errors.push(`・monsters.json: monsters[${monsterIndex}].heldItems[${heldItemIndex}].itemId "${entry.itemId}" が items.json に存在しません`);
      }
    });

    if (Array.isArray(monster.recipe)) {
      monster.recipe.forEach((pair, pairIndex) => {
        pair.forEach((recipeMonster, recipeMonsterIndex) => {
          if (!monsterIdSet.has(recipeMonster.monsterId)) {
            errors.push(`・monsters.json: monsters[${monsterIndex}].recipe[${pairIndex}][${recipeMonsterIndex}].monsterId "${recipeMonster.monsterId}" が monsters.json に存在しません`);
          }
        });
      });
    }

    if (monster.evolution?.evolvesTo && !monsterIdSet.has(monster.evolution.evolvesTo)) {
      errors.push(`・monsters.json: monsters[${monsterIndex}].evolution.evolvesTo "${monster.evolution.evolvesTo}" が monsters.json に存在しません`);
    }

    if (monster.evolution?.condition?.type === "ITEM" && typeof monster.evolution.condition.value === "string") {
      const evolutionItemId = monster.evolution.condition.value;
      if (!itemIdSet.has(evolutionItemId)) {
        errors.push(`・monsters.json: monsters[${monsterIndex}].evolution.condition.value "${evolutionItemId}" が items.json に存在しません`);
      }
    }
  });

  const pools = [
    ["wildPoolIds", validated.monsters.wildPoolIds || []],
    ["forestPoolIds", validated.monsters.forestPoolIds || []],
    ["cavePoolIds", validated.monsters.cavePoolIds || []],
    ["volcanoPoolIds", validated.monsters.volcanoPoolIds || []],
    ["ruinsPoolIds", validated.monsters.ruinsPoolIds || []],
    ["darkTowerPoolIds", validated.monsters.darkTowerPoolIds || []],
    ["frozenPeakPoolIds", validated.monsters.frozenPeakPoolIds || []],
    ["gardenPoolIds", validated.monsters.gardenPoolIds || []],
    ["swampPoolIds", validated.monsters.swampPoolIds || []],
    ["coralPoolIds", validated.monsters.coralPoolIds || []],
    ["sandValleyPoolIds", validated.monsters.sandValleyPoolIds || []],
    ["shadowGrovePoolIds", validated.monsters.shadowGrovePoolIds || []],
    ["libraryPoolIds", validated.monsters.libraryPoolIds || []],
    ["basinPoolIds", validated.monsters.basinPoolIds || []],
  ];

  pools.forEach(([poolName, poolIds]) => {
    poolIds.forEach((monsterId, poolIndex) => {
      if (!monsterIdSet.has(monsterId)) {
        errors.push(`・monsters.json: ${poolName}[${poolIndex}] "${monsterId}" が monsters.json に存在しません`);
      }
    });
  });

  if (validated.monsters.gymBoss && !monsterIdSet.has(validated.monsters.gymBoss.id)) {
    errors.push(`・monsters.json: gymBoss.id "${validated.monsters.gymBoss.id}" が monsters.json に存在しません`);
  }

  if (validated.monsters.gymBoss2 && !monsterIdSet.has(validated.monsters.gymBoss2.id)) {
    errors.push(`・monsters.json: gymBoss2.id "${validated.monsters.gymBoss2.id}" が monsters.json に存在しません`);
  }

  return errors;
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

  const validated = {
    moves: movesResult.data,
    monsters: monstersResult.data,
    items: itemsResult.data,
    abilities: abilitiesResult.data,
  };

  errors.push(...collectReferenceIntegrityErrors(validated));

  if (errors.length > 0) {
    throw new Error(`ゲームデータ検証に失敗しました。\n${errors.join("\n")}`);
  }

  return validated;
}