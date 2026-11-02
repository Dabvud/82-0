import { describe, expect, it } from "vitest";
import { isAffordable, pickPlayer } from "../../src/game/draft";
import { newSession, seedKeyFor } from "../../src/game/session";
import { FIXTURE_BUDGET, FIXTURE_POOL } from "../helpers/fixtures";

describe("Sitzung", () => {
  it("zieht für denselben Berliner Tag dieselben Angebote", () => {
    const a = newSession("daily", new Date("2026-11-02T00:00:00Z"), FIXTURE_POOL, FIXTURE_BUDGET);
    const b = newSession("daily", new Date("2026-11-02T22:59:00Z"), FIXTURE_POOL, FIXTURE_BUDGET);
    expect(a).toEqual(b);
    expect(a).toMatchObject({ date: "2026-11-02", runSeed: "2026-11-02", phase: "draft", trade: undefined });
    expect(newSession("daily", new Date("2026-11-02T23:00:00Z"), FIXTURE_POOL, FIXTURE_BUDGET).runSeed).toBe("2026-11-03");
  });

  it("gibt freien Runden neue Draft-Seeds ohne Tagesdatum", () => {
    const now = new Date("2026-11-02T12:00:00Z");
    const a = newSession("free", now, FIXTURE_POOL, FIXTURE_BUDGET);
    const b = newSession("free", now, FIXTURE_POOL, FIXTURE_BUDGET);
    expect(a.date).toBeNull();
    expect(a.runSeed).not.toBe(b.runSeed);
    expect(a.draft.offers).not.toEqual(b.draft.offers);
  });

  it("bindet die Saison an Five und Tagesdatum, unabhängig von Pick-Reihenfolge und Trade", () => {
    const s = newSession("daily", new Date("2026-11-02T12:00:00Z"), FIXTURE_POOL, FIXTURE_BUDGET);
    while (s.draft.picks.length < 5) {
      const player = Object.values(s.draft.offers).flat().find(p => isAffordable(p, s.draft.picks, FIXTURE_POOL, FIXTURE_BUDGET))!;
      s.draft = pickPlayer(s.draft, player, FIXTURE_POOL, s.runSeed, FIXTURE_BUDGET);
    }
    const key = seedKeyFor(s);
    expect(seedKeyFor({ ...s, draft: { ...s.draft, picks: [...s.draft.picks].reverse() }, trade: null })).toBe(key);
    expect(seedKeyFor({ ...s, date: "2026-11-03" })).not.toBe(key);
    expect(seedKeyFor({ ...s, mode: "free", date: null, runSeed: "a" }))
      .toBe(seedKeyFor({ ...s, mode: "free", date: null, runSeed: "b" }));
    const different = FIXTURE_POOL.find(p => !s.draft.picks.some(pick => pick.id === p.id))!;
    expect(seedKeyFor({ ...s, draft: { ...s.draft, picks: [different, ...s.draft.picks.slice(1)] } })).not.toBe(key);
  });
});
