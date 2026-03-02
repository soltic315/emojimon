type WeightResolver<T> = (entry: T) => number;

function normalizeWeight(weight: number): number {
  if (!Number.isFinite(weight)) return 0;
  return Math.max(0, weight);
}

export function pickByWeight<T>(
  entries: T[],
  resolveWeight: WeightResolver<T>,
  randomValue = Math.random(),
): T | null {
  if (!Array.isArray(entries) || entries.length === 0) return null;

  const totalWeight = entries.reduce((sum, entry) => sum + normalizeWeight(resolveWeight(entry)), 0);
  if (totalWeight <= 0) return entries[0];

  const safeRandom = Math.max(0, Math.min(0.999999, Number.isFinite(randomValue) ? randomValue : 0));
  let cursor = safeRandom * totalWeight;

  for (const entry of entries) {
    cursor -= normalizeWeight(resolveWeight(entry));
    if (cursor < 0) return entry;
  }

  return entries[entries.length - 1];
}