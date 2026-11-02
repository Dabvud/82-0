import { describe, expect, it } from "vitest";
import { accoladesFrom, eliteBySeason, pickStrengthPeak, seasonValue } from "../../src/model/strength";
import { allTimerPcts, capForTenure, franchiseStreak, pricePct } from "../../src/model/price";
import type { LeagueAvg, SeasonLine } from "../../src/model/types";

const league: LeagueAvg = {
  x2p: 30, x2pPct: 0.5, x3p: 10, x3pPct: 0.35, ftm: 20, fta: 25, ftPct: 0.8, ast: 25, tov: 15,
  orb: 10, drb: 30, trb: 40, stl: 10, blk: 5,
};
const avg: SeasonLine = {
  season: 2001, g: 82, x2p: 6, x2pPct: 0.5, x3p: 2, x3pPct: 0.35, ftm: 4, fta: 5, ftPct: 0.8, ast: 5, tov: 3,
  orb: 2, drb: 6, trb: 8, stl: 2, blk: 1, allDef1: false, allDef2: false,
};

describe("seasonValue", () => {
  it("gewichtet Punkte und Effizienz: doppelte Punkte bei gleicher Quote bringen mehr", () => {
    const more = { ...avg, x2p: 12, ftm: 8, fta: 10, x3p: 4 };
    expect(seasonValue(more, league)).toBeGreaterThan(seasonValue(avg, league));
  });
  it("deckelt den Effizienzbonus bei 1,25", () => {
    const hot = seasonValue({ ...avg, x2pPct: 0.9, x3pPct: 0.7, ftPct: 1 }, league);
    const hotter = seasonValue({ ...avg, x2pPct: 0.99, x3pPct: 0.9, ftPct: 1 }, league);
    expect(hotter).toBeCloseTo(hot, 5);
  });
});

describe("eliteBySeason", () => {
  it("nimmt je Saison das 97. Perzentil der Stammspieler", () => {
    const entries = Array.from({ length: 100 }, (_, i) => ({ season: 2001, value: i + 1, g: 60, mp: 30 }));
    entries.push({ season: 2001, value: 1000, g: 10, mp: 30 }); // kein Stammspieler
    expect(eliteBySeason(entries, 0.97).get(2001)).toBe(98);
  });
});

describe("accoladesFrom", () => {
  it("zählt All-NBA 3/2/1, MVP-Anteil × 4 und DPOY-Anteil × 2", () => {
    const teams = [
      { season: "2001", type: "All-NBA", number_tm: "1st", player_id: "a" },
      { season: "2001", type: "All-Defense", number_tm: "1st", player_id: "a" },
      { season: "2002", type: "All-NBA", number_tm: "3rd", player_id: "a" },
    ];
    const awards = [
      { season: "2001", award: "nba mvp", player_id: "a", share: "0.5" },
      { season: "2001", award: "dpoy", player_id: "a", share: "0.25" },
    ];
    const acc = accoladesFrom(teams, awards);
    expect(acc.get("a|2001")).toBeCloseTo(3 + 2 + 0.5);
    expect(acc.get("a|2002")).toBe(1);
  });
});

describe("pickStrengthPeak", () => {
  it("wählt das beste Fenster aus 3 gültigen Saisons nach Wert/Elite plus Auszeichnungen", () => {
    const seasons = [2001, 2002, 2003, 2004, 2005].map((season, i) => ({ season, g: 70, rel: [1, 1, 1, 0.5, 0.5][i], acc: [0, 0, 0, 9, 9][i] }));
    const peak = pickStrengthPeak(seasons, 0.15);
    // Fenster 2003–2005: (1 + 0,5 + 0,5)/3 + 0,15·(0 + 9 + 9)/3 = 0,667 + 0,9 = 1,567 > 1,0
    expect(peak).toMatchObject({ from: 2003, to: 2005 });
    expect(peak.value).toBeCloseTo(2 / 3 + 0.9);
  });
  it("überspringt Saisons mit zu wenigen Spielen", () => {
    const seasons = [{ season: 2001, g: 10, rel: 5, acc: 0 }, { season: 2002, g: 60, rel: 1, acc: 0 }];
    expect(pickStrengthPeak(seasons, 0.15)).toMatchObject({ from: 2002, to: 2002, value: 1 });
  });
});

describe("Preisdeckel", () => {
  it("erlaubt 35 % nur nach mindestens 7 Saisons am Stück bei derselben Franchise", () => {
    const teams = new Map([[2010, "SEA"], [2011, "OKC"], [2012, "OKC"], [2013, "OKC"], [2014, "OKC"], [2015, "OKC"], [2016, "OKC"]]);
    expect(franchiseStreak(teams, 2016)).toBe(7);
    expect(capForTenure(7)).toBe(0.35);
    expect(capForTenure(6)).toBe(0.3);
  });
  it("bricht die Serie bei einem Teamwechsel ab", () => {
    const teams = new Map([[2010, "LAL"], [2011, "BOS"], [2012, "BOS"]]);
    expect(franchiseStreak(teams, 2012)).toBe(2);
  });
  it("nutzt die letzte Saison davor, wenn der Spieler im Vertragsjahr nicht gespielt hat", () => {
    const teams = new Map([[1990, "LAL"], [1991, "LAL"]]);
    expect(franchiseStreak(teams, 1995)).toBe(2);
  });
  it("deckelt mit dem übergebenen Höchstsatz", () => {
    expect(pricePct(0.42, 1, 0.3)).toEqual({ pct: 0.3, source: "contract" });
    expect(pricePct(0.42, 1, 0.35)).toEqual({ pct: 0.35, source: "contract" });
  });
});

describe("All-Timer ohne Vertrag", () => {
  it("staffelt linear von 30 % (schwächster) bis 35 % (stärkster)", () => {
    const [lo, mid, hi] = allTimerPcts([80, 90, 99]);
    expect(lo).toBe(0.3);
    expect(mid).toBeCloseTo(0.3 + 0.05 * 10 / 19);
    expect(hi).toBe(0.35);
    expect(allTimerPcts([90])).toEqual([0.35]);
  });
});
