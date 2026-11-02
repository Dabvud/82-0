import { describe, expect, it } from "vitest";
import { assignTiers, pickPeak, toCategories } from "../../src/model/rating";
import type { RawCats, SeasonLine } from "../../src/model/types";

function rawWithScore(score: number): RawCats {
  return {
    shooter: score, finisher: score, playmaking: score,
    oreb: score, dreb: score, stl: score, blk: score, allDef: 0,
  };
}

function season(season: number, g = 82): SeasonLine {
  return {
    season, g, x2p: 6, x2pPct: 0.5, x3p: 2, x3pPct: 0.35,
    ftm: 4, fta: 5, ftPct: 0.8, ast: 5, tov: 3,
    orb: 2, drb: 6, trb: 8, stl: 2, blk: 1,
    allDef1: false, allDef2: false,
  };
}

describe("Bewertung", () => {
  it("wählt das beste Dreierfenster über die gültige Saisonfolge", () => {
    const lines = [2001, 2002, 2003, 2004, 2005, 2006]
      .map((year) => season(year, year === 2005 ? 10 : 82));
    const raws = [1, 5, 5, 5, 2, 9].map(rawWithScore);
    const peak = pickPeak(lines, raws);
    expect(peak).toMatchObject({ from: 2003, to: 2006 });
    for (const key of ["shooter", "finisher", "playmaking", "oreb", "dreb", "stl", "blk"] as const) {
      expect(peak.raw[key]).toBeCloseTo(19 / 3);
    }
    expect(peak.raw.allDef).toBe(0);
  });

  it("verwendet bei nur zwei gültigen Saisons beide", () => {
    const peak = pickPeak(
      [season(2001), season(2002, 10), season(2003)],
      [1, 9, 5].map(rawWithScore),
    );
    expect(peak).toEqual({ from: 2001, to: 2003, raw: rawWithScore(3) });
  });

  it("ordnet den schlechtesten Wert bei 0 und den besten bei 99 ein", () => {
    const [worst, best] = toCategories([rawWithScore(1), rawWithScore(5)]);
    for (const key of ["shooter", "finisher", "playmaking", "rebound", "defense", "oreb", "dreb", "blk"] as const) {
      expect(worst[key]).toBe(0);
      expect(best[key]).toBe(99);
    }
  });

  it("verteilt elf Werte auf Tier-Größen 3, 2, 2, 2, 2", () => {
    const strengths = [5, 11, 1, 8, 3, 10, 6, 2, 9, 4, 7];
    const tiers = assignTiers(strengths);
    expect([1, 2, 3, 4, 5].map((tier) => tiers.filter((value) => value === tier).length))
      .toEqual([3, 2, 2, 2, 2]);
    expect(strengths.filter((_, index) => tiers[index] === 1).sort((a, b) => b - a))
      .toEqual([11, 10, 9]);
  });
});
