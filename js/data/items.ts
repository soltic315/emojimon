export const ITEMS = {};

export function initItemsFromJson(json) {
  if (!json || !Array.isArray(json.items)) return;

  json.items.forEach((raw) => {
    ITEMS[raw.id] = {
      id: raw.id,
      name: raw.name,
      emoji: raw.emoji || "",
      description: raw.description || "",
      battleUsable: !!raw.battleUsable,
      price: raw.price || 0,
      effect: raw.effect || null,
      catchBonus: raw.catchBonus ?? 0,
    };
  });
}

export function getItemById(id) {
  return ITEMS[id] || null;
}

