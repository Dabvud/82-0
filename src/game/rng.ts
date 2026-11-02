type Rng = () => number;

export function hash(s: string): number {
  let value = 0x811c9dc5;
  // FNV-1a verarbeitet die UTF-8-Bytes, damit auch Umlaute eindeutig eingehen.
  for (const byte of new TextEncoder().encode(s)) {
    value = Math.imul(value ^ byte, 0x01000193);
  }
  return value >>> 0;
}

export function makeRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x100000000;
  };
}

export function randInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function pick<T>(rng: Rng, items: T[]): T {
  if (items.length === 0) throw new Error("Aus einer leeren Auswahl kann nicht gezogen werden.");
  return items[randInt(rng, 0, items.length - 1)];
}

export function shuffle<T>(rng: Rng, items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randInt(rng, 0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
