import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isAffordable, pickPlayer, refreshOffers } from "../src/game/draft";
import { newSession, seedKeyFor } from "../src/game/session";
import type { Session } from "../src/game/session";
import { playSeason } from "../src/game/season";
import { emptyStats, recordSeason } from "../src/game/stats";
import { tradeOffers } from "../src/game/trade";
import { loadDaily, loadSettings, loadStats, saveDaily, saveSettings, saveStats, startSession, storageAvailable } from "../src/storage";
import { FIXTURE_BUDGET, FIXTURE_LUXURY_LINE, FIXTURE_POOL, FIXTURE_TEAMS } from "./helpers/fixtures";

const now = new Date("2026-11-02T12:00:00Z");
const dailyKey = "82-0:v1:daily";
function drafted(): Session {
  const session = newSession("daily", now, FIXTURE_POOL, FIXTURE_BUDGET);
  while (session.draft.picks.length < 5) {
    const player = Object.values(session.draft.offers).flat().find(p => isAffordable(p, session.draft.picks, FIXTURE_POOL, FIXTURE_BUDGET))!;
    session.draft = pickPlayer(session.draft, player, FIXTURE_POOL, session.runSeed, FIXTURE_BUDGET);
  }
  return { ...session, phase: "deadline", trade: "pending" };
}
function season(session: Session) {
  return playSeason({ lineup: session.draft.picks, seedKey: seedKeyFor(session), trade: session.trade,
    options: { deadline: true, bankruptcy: true }, pool: FIXTURE_POOL, luxuryLine: FIXTURE_LUXURY_LINE }, FIXTURE_TEAMS);
}
beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("Tagesrätsel-Speicher", () => {
  it("speichert nur IDs und Entscheidungen und stellt die Deadline mit identischer Bilanz wieder her", () => {
    const session = drafted();
    saveDaily(session);
    const raw = JSON.parse(localStorage.getItem(dailyKey)!);
    expect(raw).toEqual({ mode: "daily", date: "2026-11-02", runSeed: session.runSeed,
      picks: session.draft.picks.map(p => p.id), refreshedAt: null, phase: "deadline", trade: "pending" });
    const restored = loadDaily(now, FIXTURE_POOL, FIXTURE_BUDGET)!;
    expect(restored).toEqual(session);
    expect(season(restored)).toEqual(season(session));
    expect(season(restored).games).toHaveLength(50);
  });

  it("erhält ein einmaliges Neuziehen samt Matrix nach dem Neuladen", () => {
    const session = newSession("daily", now, FIXTURE_POOL, FIXTURE_BUDGET);
    const first = Object.values(session.draft.offers).flat().find(p => isAffordable(p, [], FIXTURE_POOL, FIXTURE_BUDGET))!;
    session.draft = pickPlayer(session.draft, first, FIXTURE_POOL, session.runSeed, FIXTURE_BUDGET);
    session.draft = refreshOffers(session.draft, FIXTURE_POOL, session.runSeed, FIXTURE_BUDGET);
    const second = Object.values(session.draft.offers).flat().find(p => isAffordable(p, session.draft.picks, FIXTURE_POOL, FIXTURE_BUDGET))!;
    session.draft = pickPlayer(session.draft, second, FIXTURE_POOL, session.runSeed, FIXTURE_BUDGET);
    saveDaily(session);
    const loaded = loadDaily(now, FIXTURE_POOL, FIXTURE_BUDGET)!;
    expect(loaded).toEqual(session);
    expect(loaded.draft.refreshedAt).toBe(1);
  });

  it("erhält nach jedem Pick Angebote und Reihenfolge", () => {
    const session = newSession("daily", now, FIXTURE_POOL, FIXTURE_BUDGET);
    for (let i = 0; i < 5; i++) {
      const player = Object.values(session.draft.offers).flat().find(p => isAffordable(p, session.draft.picks, FIXTURE_POOL, FIXTURE_BUDGET))!;
      session.draft = pickPlayer(session.draft, player, FIXTURE_POOL, session.runSeed, FIXTURE_BUDGET);
      saveDaily(session);
      expect(loadDaily(now, FIXTURE_POOL, FIXTURE_BUDGET)).toEqual(session);
    }
    session.phase = "squad";
    saveDaily(session);
    expect(loadDaily(now, FIXTURE_POOL, FIXTURE_BUDGET)).toEqual(session);
  });

  it("zeigt nach dem Ergebnis am selben Tag wieder das Ergebnis und am Folgetag einen neuen Draft", () => {
    const result: Session = { ...drafted(), phase: "result", trade: null };
    saveDaily(result);
    expect(startSession("daily", now, FIXTURE_POOL, FIXTURE_BUDGET)).toEqual(result);
    expect(startSession("daily", new Date("2026-11-03T12:00:00Z"), FIXTURE_POOL, FIXTURE_BUDGET).phase).toBe("draft");
    saveDaily(newSession("free", now, FIXTURE_POOL, FIXTURE_BUDGET));
    expect(loadDaily(now, FIXTURE_POOL, FIXTURE_BUDGET)).toEqual(result);
    expect(startSession("free", now, FIXTURE_POOL, FIXTURE_BUDGET).phase).toBe("draft");
  });

  it("rekonstruiert einen Trade aus IDs und erhält die gesamte Saison", () => {
    const session = drafted();
    const out = session.draft.picks[0];
    const offer = tradeOffers(session.draft.picks, out, FIXTURE_POOL, FIXTURE_BUDGET, seedKeyFor(session))[0];
    expect(offer).toBeDefined();
    session.trade = { outId: out.id, offer };
    session.phase = "result";
    saveDaily(session);
    expect(JSON.parse(localStorage.getItem(dailyKey)!).trade).toEqual({ outId: out.id, inId: offer.player.id, injured: offer.injured });
    const restored = loadDaily(now, FIXTURE_POOL, FIXTURE_BUDGET)!;
    expect(restored).toEqual(session);
    expect(season(restored)).toEqual(season(session));
  });

  it.each([undefined, null, "pending"] as const)("erhält die Trade-Entscheidung %s", (trade) => {
    const session = { ...drafted(), phase: trade === "pending" ? "deadline" as const : "season" as const, trade };
    saveDaily(session);
    expect(loadDaily(now, FIXTURE_POOL, FIXTURE_BUDGET)).toEqual(session);
  });

  it("verwirft unbekannte IDs, nicht angebotene oder doppelte Picks und Budgetverstöße", () => {
    const session = newSession("daily", now, FIXTURE_POOL, FIXTURE_BUDGET);
    const notOffered = FIXTURE_POOL.find(p => !Object.values(session.draft.offers).flat().some(o => o.id === p.id))!;
    for (const picks of [["unbekannt"], [notOffered.id], [session.draft.offers[1][0].id, session.draft.offers[1][0].id]]) {
      localStorage.setItem(dailyKey, JSON.stringify({ mode: "daily", date: "2026-11-02", runSeed: "2026-11-02", phase: "draft", picks }));
      expect(loadDaily(now, FIXTURE_POOL, FIXTURE_BUDGET)).toBeNull();
    }
    saveDaily(drafted());
    expect(loadDaily(now, FIXTURE_POOL, 1)).toBeNull();
  });

  it("verwirft widersprüchliche Phasen, Seeds, Trade-IDs und manipulierte Angebote", () => {
    saveDaily(drafted());
    const raw = JSON.parse(localStorage.getItem(dailyKey)!);
    for (const change of [
      { phase: "kaputt" }, { phase: ["result"] }, { phase: "result" }, { runSeed: "anderer-seed" }, { picks: [] }, { date: "2026-02-30" },
      { trade: { outId: "unbekannt", inId: FIXTURE_POOL[0].id, injured: false } },
      { phase: "result", trade: { outId: raw.picks[0], inId: "unbekannt", injured: false } },
      { phase: "result", trade: { outId: raw.picks[0], inId: raw.picks[1], injured: false } },
    ]) {
      localStorage.setItem(dailyKey, JSON.stringify({ ...raw, ...change }));
      expect(loadDaily(now, FIXTURE_POOL, FIXTURE_BUDGET)).toBeNull();
    }
  });
});

describe("Robuster Speicher", () => {
  it("lädt und speichert Einstellungen sowie Statistik", () => {
    expect(loadSettings()).toEqual({ deadline: true, bankruptcy: true });
    expect(loadStats()).toEqual(emptyStats());
    saveSettings({ deadline: false, bankruptcy: true });
    expect(loadSettings()).toEqual({ deadline: false, bankruptcy: true });
    const stats = recordSeason(emptyStats(), { wins: 82, losses: 0, status: "done", games: [], events: [] }, "daily", "2026-11-02");
    saveStats(stats);
    expect(loadStats()).toEqual(stats);
    expect(recordSeason(loadStats(), { wins: 82, losses: 0, status: "done", games: [], events: [] }, "daily", "2026-11-02")).toEqual(stats);
    expect(storageAvailable()).toBe(true);
  });

  it("verwirft kaputtes JSON und ungültige Statistiken/Einstellungen", () => {
    for (const value of ["{", "null", "[]", '{"deadline":"ja","bankruptcy":true}']) {
      for (const key of [dailyKey, "82-0:v1:settings", "82-0:v1:stats"]) localStorage.setItem(key, value);
      expect(loadDaily(now, FIXTURE_POOL, FIXTURE_BUDGET)).toBeNull();
      expect(loadSettings()).toEqual({ deadline: true, bankruptcy: true });
      expect(loadStats()).toEqual(emptyStats());
    }
    for (const change of [{ seasons: -1 }, { totalWins: Infinity }, { best: { wins: 83, losses: -1 } }, { dailyStreak: 1 }, { lastDaily: "2026-02-30" }, { byTier: {} }]) {
      localStorage.setItem("82-0:v1:stats", JSON.stringify({ ...emptyStats(), ...change }));
      expect(loadStats()).toEqual(emptyStats());
    }
  });

  it("übersteht blockierten oder vollen Speicher", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blockiert"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("voll"); });
    expect(loadDaily(now, FIXTURE_POOL, FIXTURE_BUDGET)).toBeNull();
    expect(loadSettings()).toEqual({ deadline: true, bankruptcy: true });
    expect(loadStats()).toEqual(emptyStats());
    expect(() => { saveDaily(drafted()); saveSettings({ deadline: true, bankruptcy: true }); saveStats(emptyStats()); }).not.toThrow();
    expect(storageAvailable()).toBe(false);
  });
});
