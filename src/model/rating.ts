import { CONFIG } from "../config";
import type { Categories, RawCats, SeasonLine } from "./types";

type Tier = 1 | 2 | 3 | 4 | 5;
type Weights = Record<keyof typeof CONFIG.seasonWeights, number>;

function categoryValues(raw: RawCats): Categories {
  return {
    shooter: raw.shooter,
    finisher: raw.finisher,
    playmaking: raw.playmaking,
    rebound: CONFIG.reboundWeights.oreb * raw.oreb + CONFIG.reboundWeights.dreb * raw.dreb,
    defense: CONFIG.defenseWeights.stl * raw.stl + CONFIG.defenseWeights.blk * raw.blk + raw.allDef,
    oreb: raw.oreb,
    dreb: raw.dreb,
    blk: raw.blk,
  };
}

function weightedScore(categories: Categories, weights: Weights): number {
  return (Object.keys(weights) as (keyof Weights)[])
    .reduce((sum, key) => sum + weights[key] * categories[key], 0);
}

export function seasonScore(r: RawCats): number {
  return weightedScore(categoryValues(r), CONFIG.seasonWeights);
}

export function pickPeak(lines: SeasonLine[], raws: RawCats[]): { from: number; to: number; raw: RawCats } {
  if (lines.length === 0 || lines.length !== raws.length) {
    throw new Error("Für den Peak werden gleich viele, nicht leere Saisons und Rohwerte benötigt.");
  }
  const seasons = lines.map((line, index) => ({ line, raw: raws[index] }))
    .sort((a, b) => a.line.season - b.line.season);
  const valid = seasons.filter(({ line }) => line.g >= CONFIG.minGames);
  const candidates = valid.length > 0 ? valid : seasons;
  // Ohne gültige Saison werden alle Saisons gemeinsam gemittelt.
  const width = valid.length === 0 ? candidates.length : Math.min(CONFIG.peakSeasons, candidates.length);
  let bestStart = 0;
  let bestScore = -Infinity;
  for (let start = 0; start <= candidates.length - width; start++) {
    const score = candidates.slice(start, start + width)
      .reduce((sum, { raw }) => sum + seasonScore(raw), 0) / width;
    // Bei Gleichstand bleibt das früheste Fenster gewählt.
    if (score > bestScore) {
      bestScore = score;
      bestStart = start;
    }
  }
  const peak = candidates.slice(bestStart, bestStart + width);
  const keys = Object.keys(peak[0].raw) as (keyof RawCats)[];
  const raw = Object.fromEntries(keys.map((key) => [
    key, peak.reduce((sum, entry) => sum + entry.raw[key], 0) / peak.length,
  ])) as unknown as RawCats;
  return { from: peak[0].line.season, to: peak[peak.length - 1].line.season, raw };
}

export function toCategories(peaks: RawCats[]): Categories[] {
  const values = peaks.map(categoryValues);
  return values.map((entry) => {
    const keys = Object.keys(entry) as (keyof Categories)[];
    return Object.fromEntries(keys.map((key) => {
      const lower = values.filter((other) => other[key] < entry[key]).length;
      const equal = values.filter((other) => other[key] === entry[key]).length;
      // Gleiche Werte teilen sich den mittleren Rang; Einzelspieler liegen in der Mitte.
      const percentile = values.length === 1 ? 0.5
        : (lower + (equal - 1) / 2) / (values.length - 1);
      return [key, percentile * CONFIG.categoryMax];
    })) as unknown as Categories;
  });
}

/** Stärke 0–99 als Perzentil der Rohwert-Summe: Wie weit jemand vorne liegt, zählt mit. */
export function strengthsFromRaw(peaks: RawCats[]): number[] {
  const scores = peaks.map(seasonScore);
  return scores.map((score) => {
    const lower = scores.filter((other) => other < score).length;
    const equal = scores.filter((other) => other === score).length;
    return scores.length === 1 ? CONFIG.categoryMax / 2
      : (lower + (equal - 1) / 2) / (scores.length - 1) * CONFIG.categoryMax;
  });
}

export function strength(c: Categories): number {
  return Math.max(0, Math.min(CONFIG.categoryMax, weightedScore(c, CONFIG.strengthWeights)));
}

export function assignTiers(strengths: number[]): (1 | 2 | 3 | 4 | 5)[] {
  const order = strengths.map((value, index) => ({ value, index }))
    .sort((a, b) => b.value - a.value);
  const tiers: Tier[] = [];
  const tierCount = Object.keys(CONFIG.tierPricePct).length;
  const baseSize = Math.floor(order.length / tierCount);
  const remainder = order.length % tierCount;
  let offset = 0;
  for (let tier = 1; tier <= tierCount; tier++) {
    const size = baseSize + (tier <= remainder ? 1 : 0);
    for (const entry of order.slice(offset, offset + size)) {
      tiers[entry.index] = tier as Tier;
    }
    offset += size;
  }
  return tiers;
}
