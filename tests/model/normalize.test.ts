import { describe, expect, it } from "vitest";
import { seasonRaw } from "../../src/model/normalize";
import type { LeagueAvg, SeasonLine } from "../../src/model/types";

const league: LeagueAvg = {
  x2p: 30, x2pPct: 0.5, x3p: 10, x3pPct: 0.35,
  ftm: 20, fta: 25, ftPct: 0.8, ast: 25, tov: 15,
  orb: 10, drb: 30, trb: 40, stl: 10, blk: 5,
};
const average = {
  season: 2001, g: 82, x2p: 6, x2pPct: 0.5, x3p: 2, x3pPct: 0.35,
  ftm: 4, fta: 5, ftPct: 0.8, ast: 5, tov: 3,
  orb: 2, drb: 6, trb: 8, stl: 2, blk: 1,
  allDef1: false, allDef2: false,
} satisfies SeasonLine;

describe("Saison-Normalisierung", () => {
  it("normalisiert einen Liga-Durchschnittsspieler", () => {
    const raw = seasonRaw(average, league);
    expect(raw.shooter).toBeCloseTo(1);
    expect(raw.finisher).toBeCloseTo(1);
    expect(raw.playmaking).toBeCloseTo(0.5);
    expect(raw.oreb).toBe(1);
    expect(raw.dreb).toBe(1);
    expect(raw.stl).toBe(1);
    expect(raw.blk).toBe(1);
  });

  it("erhöht Playmaking bei doppelten Assists um 1", () => {
    const before = seasonRaw(average, league);
    const after = seasonRaw({ ...average, ast: average.ast * 2 }, league);
    expect(after.playmaking - before.playmaking).toBeCloseTo(1);
  });

  it("senkt Finisher bei 90 % der Liga-2P-Quote auf das 0,81-Fache", () => {
    const before = seasonRaw(average, league);
    const after = seasonRaw({ ...average, x2pPct: league.x2pPct * 0.9 }, league);
    expect(after.finisher).toBeCloseTo(before.finisher * 0.81);
  });

  it("nennt bei fehlenden Steals das Feld und die Saison", () => {
    const normalize = () => seasonRaw({ ...average, stl: null }, league);
    expect(normalize).toThrow(/stl/);
    expect(normalize).toThrow(/2001/);
  });

  it.each(["x2p", "ftm", "ast"] as const)("weist fehlendes %s mit Feld und Saison zurück", (field) => {
    expect(() => seasonRaw({ ...average, [field]: null }, league)).toThrow(new RegExp(`${field}.*2001`));
  });

  it("wertet Spieler ohne Dreier nur über die Freiwurfquote, auch ohne Liga-Dreierwerte", () => {
    const noThrees = { ...average, x3p: 0, x3pPct: null };
    const preThreeLeague = { ...league, x3p: null, x3pPct: null };
    expect(seasonRaw(noThrees, preThreeLeague).shooter).toBeCloseTo(0.25);
  });

  it("dämpft Dreier aus Epochen mit kaum Liga-Dreiern (Mindest-Schnitt und Effizienz-Deckel)", () => {
    const eighties = { ...league, x3p: 0.9, x3pPct: 0.282 };
    const bird = { ...average, x3p: 1.4, x3pPct: 0.423, ftPct: 0.8 };
    // 1,4 Treffer gegen mindestens 1,0 pro Platz, Effizienz gedeckelt auf 1,35.
    expect(seasonRaw(bird, eighties).shooter).toBeCloseTo(0.75 * 1.4 * 1.35 ** 2 + 0.25);
  });
});
