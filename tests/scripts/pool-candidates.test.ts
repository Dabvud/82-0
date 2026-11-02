// @vitest-environment node
import { describe, expect, it } from "vitest";
import { fillMissingZero, leagueForRating, matchPlayer, selectPool } from "../../scripts/pool-candidates";
import type { PoolCandidate } from "../../scripts/pool-candidates";
import type { LeagueAvg, Pos, SeasonLine } from "../../src/model/types";

describe("Pool-Zuordnung", () => {
  const info = new Map([
    ["paytoga01", { name: "Gary Payton", first: 1991, last: 2007 }],
    ["paytoga02", { name: "Gary Payton II", first: 2017, last: 2027 }],
  ]);
  it("trennt normalisierte Namensvettern anhand der Karriere und rechnet Startjahre um", () => {
    expect(matchPlayer({ name: "Gary Payton II", stations: [{ from: 2016, to: null }] }, info))
      .toEqual({ bbrefId: "paytoga02", kandidaten: ["paytoga02"] });
    expect(matchPlayer({ name: "Gary Payton", stations: [{ from: 1990, to: 2006 }] }, info))
      .toEqual({ bbrefId: "paytoga01", kandidaten: ["paytoga01"] });
  });
  it("erlaubt genau ein Jahr Toleranz und lässt Mehrdeutigkeit offen", () => {
    expect(matchPlayer({ name: "Gary Payton", stations: [{ from: 2007, to: 2007 }] }, info).bbrefId)
      .toBe("paytoga01");
    expect(matchPlayer({ name: "Gary Payton", stations: [{ from: 2008, to: 2008 }] }, info))
      .toEqual({ kandidaten: ["paytoga01", "paytoga02"] });
    expect(matchPlayer({ name: "Gary Payton", stations: [{ from: 1990, to: null }] }, info))
      .toEqual({ kandidaten: ["paytoga01", "paytoga02"] });
    expect(matchPlayer({ name: "Unknown", stations: [{ from: 2000, to: null }] }, info))
      .toEqual({ kandidaten: [] });
  });
  it("setzt vorläufige Spielerlücken auf 0, ohne die Quelldaten zu verändern", () => {
    const line = { x3p: null, tov: null, orb: 2 } as SeasonLine;
    expect(fillMissingZero(line)).toMatchObject({ x3p: 0, tov: 0, orb: 2 });
    expect(line.x3p).toBeNull();
  });
  it("zeigt belegte Namensvarianten nur als Prüfkandidaten, ohne automatisch zuzuordnen", () => {
    const candidates = new Map([["hardaan01", { name: "Anfernee Hardaway", first: 1994, last: 2008 }]]);
    expect(matchPlayer({ name: "Penny Hardaway", stations: [{ from: 1993, to: 2007 }] }, candidates))
      .toEqual({ kandidaten: ["hardaan01"] });
  });
  it("leitet eine fehlende Liga-Freiwurfquote für die Berechnung aus Treffern und Versuchen ab", () => {
    const league = { ftm: 26.5, fta: 35.9, ftPct: 0 } as LeagueAvg;
    expect(leagueForRating(league).ftPct).toBeCloseTo(26.5 / 35.9);
    expect(league.ftPct).toBe(0);
    expect(leagueForRating({ ...league, ftPct: 0.74 }).ftPct).toBe(0.74);
  });
});

describe("Pool-Auswahl", () => {
  const candidate = (id: string, positions: Pos[], strength: number, group = "journeyman", tncTier = 3): PoolCandidate => ({
    id, name: id, bbrefId: id, positions, strength, group, tncTier,
    peak: { from: 2000, to: 2002 }, selected: false, grund: "",
  });
  it("behält alle Stars und Tier 1–2 und tauscht nur freie Plätze für die Quoten", () => {
    const players = [candidate("star", ["F"], 1, "allstar"), candidate("tier2", ["G"], 2, "aktiv", 2),
      candidate("guard", ["G"], 95), candidate("forward", ["F"], 90), candidate("center", ["C"], 20)];
    selectPool(players, { target: 4, minG: 2, minC: 1 });
    expect(players.filter(p => p.selected).map(p => p.id)).toEqual(["star", "tier2", "guard", "center"]);
    expect(players[4].grund).toContain("C-Quote");
  });
  it("meldet unmögliche Quoten und zu viele Pflichtspieler", () => {
    expect(() => selectPool([candidate("a", ["F"], 1)], { target: 1, minG: 1, minC: 0 })).toThrow();
    expect(() => selectPool([candidate("a", ["F"], 1, "allstar"), candidate("b", ["F"], 2, "allstar")],
      { target: 1, minG: 0, minC: 0 })).toThrow();
  });
});
