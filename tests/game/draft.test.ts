import { describe, expect, it } from "vitest";
import { drawOffers, isAffordable, minCostToComplete, pickPlayer, refreshOffers, startDraft } from "../../src/game/draft";
import { assignSlots, canAdd } from "../../src/game/slots";
import { hash, makeRng, pick, shuffle } from "../../src/game/rng";
import type { Player, Pos, Tier } from "../../src/game/types";
import { FIXTURE_BUDGET, FIXTURE_POOL, makePlayer } from "../helpers/fixtures";

const tiers: Tier[] = [1, 2, 3, 4, 5];
const cost = (players: Player[]) => players.reduce((sum, p) => sum + p.price, 0);
function player(id: string, positions: Pos[], price: number, tier: Tier = 1): Player {
  return makePlayer({ id, positions, price, tier });
}

describe("Budgetschutz", () => {
  const pool = [
    player("g1", ["G"], 10), player("g2", ["G"], 20),
    player("f1", ["F"], 30), player("f2", ["F"], 40), player("c1", ["C"], 50),
  ];

  it("berechnet die billigste vollständige Ergänzung ohne bereits gewählte Spieler", () => {
    expect(minCostToComplete([], pool)).toBe(150);
    expect(minCostToComplete([pool[0]], pool)).toBe(140);
    expect(minCostToComplete(pool, pool)).toBe(0);
    expect(minCostToComplete([], pool.slice(0, 4))).toBe(Infinity);
    expect(minCostToComplete([pool[0], pool[0]], pool)).toBe(Infinity);
  });

  it("zählt Doppelpositionen nicht doppelt und findet die günstigste Zuordnung", () => {
    const flexible = player("gf", ["G", "F"], 1);
    expect(minCostToComplete([], [...pool, flexible])).toBe(111);
    expect(minCostToComplete([flexible], [...pool, flexible])).toBe(110);
    expect(minCostToComplete([], [flexible, pool[0], pool[2], pool[4]])).toBe(Infinity);
  });

  it("berücksichtigt alle sechs günstigen Kandidaten auch bei vielen Doppelpositionen", () => {
    const flexible = Array.from({ length: 8 }, (_, i) => player(`gf${i}`, ["G", "F"], i + 1));
    expect(minCostToComplete([], [...flexible, pool[4]])).toBe(60);
    expect(minCostToComplete(flexible.slice(0, 3), [...flexible, pool[4]])).toBe(54);
  });

  it("sperrt einen Preis über Restbudget minus Mindestkosten und erlaubt die exakte Grenze", () => {
    const expensive = player("teuer", ["G"], 31);
    const withExpensive = [...pool, expensive];
    expect(isAffordable(expensive, [pool[0]], withExpensive, 160)).toBe(false);
    expect(isAffordable(expensive, [pool[0]], withExpensive, 161)).toBe(true);
    expect(isAffordable(pool[0], [pool[0]], pool, 1000)).toBe(false);
    expect(isAffordable(pool[4], [pool[0], pool[1], pool[2], pool[3]], pool, 150)).toBe(true);
    expect(isAffordable(pool[4], [pool[0]], pool.slice(0, 2), 1000)).toBe(false);
  });
});

describe("Tier-Angebote", () => {
  it("verwendet einen Fixture-Pool mit 60 Spielern, realistischen Preisen und eindeutigen IDs", () => {
    expect(FIXTURE_POOL).toHaveLength(60);
    expect(new Set(FIXTURE_POOL.map((p) => p.id)).size).toBe(60);
    expect(FIXTURE_BUDGET).toBe(1.4 * 164_961_000);
    const ranges = { 1: [0.25, 0.35], 2: [0.15, 0.30], 3: [0.08, 0.18], 4: [0.03, 0.10], 5: [0.01, 0.04] };
    for (const tier of tiers) {
      const players = FIXTURE_POOL.filter((p) => p.tier === tier);
      expect(players).toHaveLength(12);
      expect(players.filter((p) => p.positions.length === 1 && p.positions[0] === "G")).toHaveLength(5);
      expect(players.filter((p) => p.positions.length === 1 && p.positions[0] === "F")).toHaveLength(4);
      expect(players.filter((p) => p.positions.length === 1 && p.positions[0] === "C")).toHaveLength(2);
      expect(players.filter((p) => p.positions.length === 2)).toHaveLength(1);
      for (const p of players) {
        expect(p.price).toBeGreaterThanOrEqual(ranges[tier][0] * 164_961_000);
        expect(p.price).toBeLessThanOrEqual(ranges[tier][1] * 164_961_000);
      }
    }
    expect(FIXTURE_POOL.some((p) => p.overpaid)).toBe(true);
  });

  it("zieht bei gleichen Eingaben identische Angebote, ohne den Pool zu verändern", () => {
    const before = structuredClone(FIXTURE_POOL);
    const offers = drawOffers(FIXTURE_POOL, [], "gleich", FIXTURE_BUDGET);
    expect(offers).toEqual(drawOffers(FIXTURE_POOL, [], "gleich", FIXTURE_BUDGET));
    expect(offers).not.toEqual(drawOffers(FIXTURE_POOL, [], "anders", FIXTURE_BUDGET));
    expect(FIXTURE_POOL).toEqual(before);
    for (const tier of tiers) {
      expect(offers[tier]).toHaveLength(5);
      expect(offers[tier].every((p) => p.tier === tier)).toBe(true);
      expect(assignSlots(offers[tier])).not.toBeNull();
    }
  });

  it("verwendet je Runde und Tier den vereinbarten Seed und die erste freie Zielposition", () => {
    const offers = drawOffers(FIXTURE_POOL, [], "mischung", FIXTURE_BUDGET);
    for (const tier of tiers) {
      const shuffled = shuffle(makeRng(hash(`mischung|r1|t${tier}`)), FIXTURE_POOL.filter((p) => p.tier === tier));
      const remaining = { G: 2, F: 2, C: 1 };
      const expected = shuffled.filter((p) => {
        const pos = p.positions.find((position) => remaining[position] > 0);
        if (!pos) return false;
        remaining[pos]--;
        return true;
      });
      expect(offers[tier]).toEqual(expected);
    }
  });

  it("bietet nach zwei Guards nur passende, noch nicht gewählte Spieler an", () => {
    const picks = FIXTURE_POOL.filter((p) => p.positions.length === 1 && p.positions[0] === "G").slice(0, 2);
    const offers = drawOffers(FIXTURE_POOL, picks, "zwei-guards", FIXTURE_BUDGET);
    for (const cards of Object.values(offers)) {
      expect(cards.length).toBeLessThanOrEqual(5);
      expect(new Set(cards.map((p) => p.id)).size).toBe(cards.length);
      expect(cards.every((p) => !picks.some((chosen) => chosen.id === p.id) && canAdd(picks, p))).toBe(true);
      expect(cards.every((p) => p.positions.length !== 1 || p.positions[0] !== "G")).toBe(true);
    }
  });

  it("füllt ein Tier mit übrigen passenden Spielern auf und erlaubt kleine oder leere Tiers", () => {
    const pool = Array.from({ length: 7 }, (_, i) => player(`f${i}`, ["F"], 1, 3));
    const offers = drawOffers(pool, [], "klein", 100);
    expect(offers[3]).toHaveLength(5);
    expect(offers[1]).toEqual([]);
    expect(drawOffers(pool.slice(0, 2), [], "klein", 100)[3]).toHaveLength(2);
  });

  it.each([false, true])("rettet ein vollständig unbezahlbares Angebot in Tier 5 (Tier 5 vorhanden: %s)", (hasTierFive) => {
    const picks = [player("g1", ["G"], 10), player("g2", ["G"], 10), player("f1", ["F"], 10), player("f2", ["F"], 10)];
    const expensive = Array.from({ length: 30 }, (_, i) => player(`c${i}`, ["C"], 100, hasTierFive ? 5 : 1));
    const cheap = player("billig", ["C"], 1, hasTierFive ? 5 : 1);
    const pool = [...picks, ...expensive, cheap];
    // Ein Seed, der die einzige bezahlbare Karte regulär nicht zieht, erzwingt den Ersatzpfad.
    const tier = hasTierFive ? 5 : 1;
    const seed = Array.from({ length: 100 }, (_, i) => `rettung-${i}`).find((s) =>
      !shuffle(makeRng(hash(`${s}|r5|t${tier}`)), [...expensive, cheap]).slice(0, 5).some((p) => p.id === cheap.id),
    )!;
    expect(seed).toBeDefined();
    const offers = drawOffers(pool, picks, seed, 41);
    expect(offers[5].at(-1)).toEqual(cheap);
    expect(offers[5].length).toBeLessThanOrEqual(5);
    expect(Object.values(offers).flat().some((p) => isAffordable(p, picks, pool, 41))).toBe(true);
  });
});

describe("Draft-Zustand", () => {
  it("behält die Matrix über den Draft: nach einem Pick verschwindet nur der gewählte Spieler", () => {
    const state = startDraft(FIXTURE_POOL, "zustand", FIXTURE_BUDGET);
    const before = structuredClone(state);
    expect(state.picks).toEqual([]);
    expect(state.round).toBe(1);
    expect(state.refreshedAt).toBeNull();
    const p = Object.values(state.offers).flat().find((card) => isAffordable(card, state.picks, FIXTURE_POOL, FIXTURE_BUDGET))!;
    const next = pickPlayer(state, p, FIXTURE_POOL, "zustand", FIXTURE_BUDGET);
    expect(next.picks).toEqual([p]);
    expect(next.round).toBe(2);
    const remove = (o: typeof state.offers) => Object.fromEntries(Object.entries(o).map(([t, list]) => [t, list.filter((c) => c.id !== p.id)]));
    expect(next.offers).toEqual(remove(state.offers));
    expect(state).toEqual(before);
  });

  it("erlaubt genau einmal pro Run, die Matrix neu zu ziehen", () => {
    const state = startDraft(FIXTURE_POOL, "neu", FIXTURE_BUDGET);
    const p = Object.values(state.offers).flat().find((card) => isAffordable(card, [], FIXTURE_POOL, FIXTURE_BUDGET))!;
    const afterPick = pickPlayer(state, p, FIXTURE_POOL, "neu", FIXTURE_BUDGET);
    const refreshed = refreshOffers(afterPick, FIXTURE_POOL, "neu", FIXTURE_BUDGET);
    expect(refreshed.refreshedAt).toBe(1);
    expect(refreshed.picks).toEqual(afterPick.picks);
    expect(refreshed.offers).toEqual(refreshOffers(afterPick, FIXTURE_POOL, "neu", FIXTURE_BUDGET).offers);
    expect(refreshed.offers).not.toEqual(afterPick.offers);
    expect(Object.values(refreshed.offers).flat().every((c) => canAdd(refreshed.picks, c))).toBe(true);
    expect(() => refreshOffers(refreshed, FIXTURE_POOL, "neu", FIXTURE_BUDGET)).toThrow(/einmal/);
  });

  it("weist nicht angebotene und unbezahlbare Picks ab", () => {
    const state = startDraft(FIXTURE_POOL, "ungültig", FIXTURE_BUDGET);
    expect(() => pickPlayer(state, makePlayer({ id: "fremd" }), FIXTURE_POOL, "ungültig", FIXTURE_BUDGET)).toThrow();
    expect(() => pickPlayer(state, state.offers[1][0], FIXTURE_POOL, "ungültig", 1)).toThrow();
    expect(() => pickPlayer(state, { ...state.offers[1][0], price: 0 }, FIXTURE_POOL, "ungültig", 1)).toThrow();
  });
});

describe("Draft-Massentests", () => {
  it.each(["zufällig", "gierig"] as const)("beendet 5 000 Drafts ohne Sackgasse: %s", async (strategy) => {
    let maxCost = 0;
    for (let draft = 0; draft < 5000; draft++) {
      // Kurz abgeben, damit der Vitest-Worker bei der langen Schleife erreichbar bleibt.
      if (draft % 200 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
      const seed = `${strategy}-${draft}`;
      const rng = makeRng(hash(`auswahl-${seed}`));
      let state = startDraft(FIXTURE_POOL, seed, FIXTURE_BUDGET);
      // Jeder zweite Draft nutzt das einmalige Neuziehen in einer zufälligen Runde.
      const refreshRound = draft % 2 === 0 ? 1 + Math.floor(rng() * 5) : 0;
      for (let round = 1; round <= 5; round++) {
        if (round === refreshRound) state = refreshOffers(state, FIXTURE_POOL, seed, FIXTURE_BUDGET);
        const cards = Object.values(state.offers).flat();
        if (state.round !== round || Object.values(state.offers).some((offer) => offer.length > 5)) {
          throw new Error(`Ungültige Angebote: ${seed}, Runde ${round}`);
        }
        const affordable = cards.filter((p) => isAffordable(p, state.picks, FIXTURE_POOL, FIXTURE_BUDGET));
        if (affordable.length === 0) throw new Error(`Sackgasse: ${seed}, Runde ${round}`);
        const chosen = strategy === "zufällig" ? pick(rng, affordable)
          : affordable.reduce((a, b) => a.price >= b.price ? a : b);
        state = pickPlayer(state, chosen, FIXTURE_POOL, seed, FIXTURE_BUDGET);
      }
      const slots = assignSlots(state.picks);
      const total = cost(state.picks);
      if (state.picks.length !== 5 || new Set(state.picks.map((p) => p.id)).size !== 5
        || !slots || state.picks.some((p) => !p.positions.includes(slots[p.id]))
        || Object.values(slots).filter((pos) => pos === "G").length !== 2
        || Object.values(slots).filter((pos) => pos === "F").length !== 2
        || Object.values(slots).filter((pos) => pos === "C").length !== 1
        || total > FIXTURE_BUDGET) {
        throw new Error(`Ungültiges Endergebnis: ${seed}, Preis ${total}`);
      }
      maxCost = Math.max(maxCost, total);
      expect(() => pickPlayer(state, FIXTURE_POOL[0], FIXTURE_POOL, seed, FIXTURE_BUDGET)).toThrow();
    }
    console.info(`${strategy}: 5 000 Drafts, 25 000 Picks, 0 Sackgassen; Höchstpreis ${maxCost} / ${FIXTURE_BUDGET}`);
  }, 120_000);
});
