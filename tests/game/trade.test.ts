import { afterEach, describe, expect, it, vi } from "vitest";
import { CONFIG } from "../../src/config";
import { hash, makeRng, pick } from "../../src/game/rng";
import { playSeason } from "../../src/game/season";
import type { GameResult, SeasonInput } from "../../src/game/season";
import { canAdd } from "../../src/game/slots";
import { teamRating } from "../../src/game/team";
import * as tradeModule from "../../src/game/trade";
import { injuryGames, pickFiller, tradeOffers } from "../../src/game/trade";
import type { Player, TradeDecision } from "../../src/game/types";
import { FIXTURE_BUDGET, FIXTURE_POOL, FIXTURE_TEAMS, makePlayer } from "../helpers/fixtures";

const lineup = [24, 25, 29, 30, 33].map((index) => FIXTURE_POOL[index]);
const out = lineup[0];
const cost = (players: Player[]) => players.reduce((sum, player) => sum + player.price, 0);
const withoutOut = (players: Player[], outgoing: Player) => players.filter((player) => player.id !== outgoing.id);

function candidate(id: string, partial: Partial<Player> = {}): Player {
  return makePlayer({ id, price: out.price, value: out.value, ...partial });
}

afterEach(() => vi.restoreAllMocks());

describe("Trade-Angebote", () => {
  it("verwendet die vereinbarte Konfiguration", () => {
    expect(CONFIG.trade).toEqual({
      salaryWindow: 0.15, salaryWidenStep: 0.10, salaryMaxWindow: 0.45,
      valueWindow: 6, injuredChance: 0.30, injuryMin: 3, injuryMax: 15, offers: 3,
    });
  });

  it("erfüllt mit dem Fixture-Pool Platz-, Gehalts-, Budget- und Wertregel ohne Dopplungen", () => {
    for (const outgoing of lineup) {
      const offers = tradeOffers(lineup, outgoing, FIXTURE_POOL, FIXTURE_BUDGET, "fixture-trades");
      expect(offers.length).toBeGreaterThan(0);
      expect(offers.length).toBeLessThanOrEqual(3);
      expect(new Set(offers.map(({ player }) => player.id)).size).toBe(offers.length);
      for (const { player, injured } of offers) {
        expect(lineup.some((current) => current.id === player.id)).toBe(false);
        expect(canAdd(withoutOut(lineup, outgoing), player)).toBe(true);
        expect(Math.abs(player.price - outgoing.price)).toBeLessThanOrEqual(outgoing.price * 0.45);
        expect(player.price).toBeLessThanOrEqual(FIXTURE_BUDGET - cost(lineup) + outgoing.price);
        expect(Math.abs(player.value - outgoing.value)).toBeLessThanOrEqual(6);
        expect(injured).toBe(false);
      }
    }
  });

  it.each([0.15, 0.25, 0.35, 0.45])("erweitert das Gehaltsfenster nur bis zu den nötigen ±%s", (window) => {
    const outgoing = candidate("abgang", { price: 100 });
    const players = [outgoing, ...lineup.slice(1)];
    const pool = [
      candidate("untergrenze", { price: 100 - 100 * window }),
      candidate("mitte", { price: 100 }),
      candidate("obergrenze", { price: 100 + 100 * window }),
      candidate("außerhalb", { price: 100 + 100 * (window + 0.01) }),
    ];
    expect(tradeOffers(players, outgoing, pool, FIXTURE_BUDGET, "fenster").map(({ player }) => player.id).sort())
      .toEqual(["mitte", "obergrenze", "untergrenze"]);
  });

  it("zählt nur geeignete Kandidaten beim Erweitern des Fensters", () => {
    const pool = [
      candidate("geeignet"), candidate("falscher-platz", { positions: ["C"] }),
      candidate("falscher-wert", { value: out.value + 7 }),
      candidate("erweitert-1", { price: out.price * 1.2 }),
      candidate("erweitert-2", { price: out.price * 0.8 }),
    ];
    expect(tradeOffers(lineup, out, pool, FIXTURE_BUDGET, "geeignete").map(({ player }) => player.id).sort())
      .toEqual(["erweitert-1", "erweitert-2", "geeignet"]);
  });

  it("beachtet das Restbudget einschließlich Abgang und lässt die exakte Grenze zu", () => {
    const pool = [candidate("bezahlbar"), candidate("zu-teuer", { price: out.price + 1 })];
    expect(tradeOffers(lineup, out, pool, cost(lineup), "budget"))
      .toEqual([{ player: pool[0], injured: false }]);
  });

  it("lässt Doppelpositionen über eine neue Platzzuordnung zu", () => {
    const flexible = candidate("flexibel", { positions: ["G", "F"] });
    const players = [out, lineup[1], flexible, ...lineup.slice(3)];
    const forward = candidate("neuer-forward", { positions: ["F"] });
    expect(tradeOffers(players, out, [forward], FIXTURE_BUDGET, "plätze"))
      .toEqual([{ player: forward, injured: false }]);
  });

  it("begrenzt die Wertdifferenz bei normalen Abgängen einschließlich der Grenze", () => {
    const pool = [
      candidate("wert-unten", { value: out.value - 6 }),
      candidate("wert-oben", { value: out.value + 6 }),
      candidate("wert-außerhalb", { value: out.value + 6.01 }),
    ];
    expect(tradeOffers(lineup, out, pool, FIXTURE_BUDGET, "wert").map(({ player }) => player.id).sort())
      .toEqual(["wert-oben", "wert-unten"]);
  });

  it("liefert bei fehlenden passenden Gehältern oder leerem Pool eine leere Liste", () => {
    expect(tradeOffers(lineup, out, [candidate("zu-billig", { price: out.price * 0.54 })], FIXTURE_BUDGET, "leer"))
      .toEqual([]);
    expect(tradeOffers(lineup, out, [], FIXTURE_BUDGET, "leer")).toEqual([]);
    expect(tradeOffers(lineup, out, lineup, FIXTURE_BUDGET, "nur-kader")).toEqual([]);
  });

  it("liefert höchstens die vorhandenen eindeutigen Kandidaten", () => {
    const player = candidate("einziger");
    expect(tradeOffers(lineup, out, [player, player], FIXTURE_BUDGET, "doppelt"))
      .toEqual([{ player, injured: false }]);
  });

  it("ist deterministisch und verändert weder Kader, Pool noch Abgang", () => {
    const pool = Array.from({ length: 12 }, (_, index) => candidate(`kandidat-${index}`));
    const before = structuredClone({ lineup, out, pool });
    const offers = tradeOffers(lineup, out, pool, FIXTURE_BUDGET, "gleich");
    expect(offers).toEqual(tradeOffers(lineup, out, pool, FIXTURE_BUDGET, "gleich"));
    expect(offers).not.toEqual(tradeOffers(lineup, out, pool, FIXTURE_BUDGET, "anders"));
    expect({ lineup, out, pool }).toEqual(before);
  });

  const overpaid = { ...out, overpaid: true, value: -10 };
  const overpaidLineup = [overpaid, ...lineup.slice(1)];
  const mixedPool = [true, false].flatMap((isOverpaid) => Array.from({ length: 6 }, (_, index) =>
    candidate(`${isOverpaid ? "überbezahlt" : "gut"}-${index}`, { overpaid: isOverpaid, value: isOverpaid ? -10 : 2 }),
  ));

  it("zieht die Risikoklasse für jeden Vorschlag neu mit dem vereinbarten Seed", () => {
    const rng = makeRng(hash(`risiko|trade|${overpaid.id}`));
    const expected = [];
    const remaining = [...mixedPool];
    for (let index = 0; index < 3; index++) {
      const injured = rng() >= 0.7;
      const player = pick(rng, remaining.filter((p) => p.overpaid !== injured));
      expected.push({ player, injured });
      remaining.splice(remaining.findIndex((p) => p.id === player.id), 1);
    }
    expect(tradeOffers(overpaidLineup, overpaid, mixedPool, FIXTURE_BUDGET, "risiko")).toEqual(expected);
  });

  it("liefert über 10 000 Seeds je Vorschlag 30 % ± 2 % verletzte gute Spieler", async () => {
    const injuredCounts = [0, 0, 0];
    for (let index = 0; index < 10_000; index++) {
      if (index % 200 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
      const offers = tradeOffers(overpaidLineup, overpaid, mixedPool, FIXTURE_BUDGET, `quote-${index}`);
      expect(offers).toHaveLength(3);
      expect(new Set(offers.map(({ player }) => player.id)).size).toBe(3);
      offers.forEach(({ player, injured }, offerIndex) => {
        expect(player.overpaid).toBe(!injured);
        if (injured) injuredCounts[offerIndex]++;
      });
    }
    for (const count of injuredCounts) {
      expect(count / 10_000).toBeGreaterThanOrEqual(0.28);
      expect(count / 10_000).toBeLessThanOrEqual(0.32);
    }
  });

  it("fällt ohne gute Kandidaten auf unverletzte überbezahlte Spieler zurück", () => {
    const pool = mixedPool.filter((player) => player.overpaid);
    const offers = tradeOffers(overpaidLineup, overpaid, pool, FIXTURE_BUDGET, "nur-überbezahlt");
    expect(offers).toHaveLength(3);
    expect(offers.every(({ player, injured }) => player.overpaid && !injured)).toBe(true);
  });

  it("füllt bei erschöpfter Risikoklasse aus der verbleibenden Klasse auf", () => {
    const pool = mixedPool.filter((player) => !player.overpaid);
    const offers = tradeOffers(overpaidLineup, overpaid, pool, FIXTURE_BUDGET, "nur-gute");
    expect(offers).toHaveLength(3);
    expect(offers.every(({ player, injured }) => !player.overpaid && injured)).toBe(true);
  });
});

describe("Verletzungsdauer", () => {
  it("ist deterministisch und deckt über 10 000 Seeds alle ganzen Werte von 3 bis 15 ab", async () => {
    const durations = new Set<number>();
    for (let index = 0; index < 10_000; index++) {
      if (index % 200 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
      const seedKey = `dauer-${index}`;
      const games = injuryGames(seedKey, "abgang", "neuzugang");
      expect(games).toBe(injuryGames(seedKey, "abgang", "neuzugang"));
      expect(Number.isInteger(games)).toBe(true);
      durations.add(games);
    }
    expect([...durations].sort((a, b) => a - b)).toEqual(Array.from({ length: 13 }, (_, index) => index + 3));
    expect(new Set(Array.from({ length: 20 }, (_, index) => injuryGames("gleicher-seed", `abgang-${index}`, "neu"))).size)
      .toBeGreaterThan(1);
    expect(new Set(Array.from({ length: 20 }, (_, index) => injuryGames("gleicher-seed", "abgang", `neu-${index}`))).size)
      .toBeGreaterThan(1);
  });
});

describe("Lückenfüller", () => {
  it("wählt deterministisch einen schwächeren passenden Tier-5-Spieler außerhalb des Kaders", () => {
    const before = structuredClone(FIXTURE_POOL);
    const filler = pickFiller(lineup, out, FIXTURE_POOL, "füller");
    expect(filler).toEqual(pickFiller(lineup, out, FIXTURE_POOL, "füller"));
    expect(filler.tier).toBe(5);
    expect(filler.strength).toBeLessThan(out.strength);
    expect(lineup.some((player) => player.id === filler.id)).toBe(false);
    expect(canAdd(withoutOut(lineup, out), filler)).toBe(true);
    expect(FIXTURE_POOL).toEqual(before);
  });

  it("nimmt ohne schwächeren Kandidaten den schwächsten passenden Tier-5-Spieler", () => {
    const outgoing = { ...out, strength: 10, tier: 5 as const };
    const players = [outgoing, ...lineup.slice(1)];
    const weakest = candidate("schwächster", { tier: 5, strength: 20, price: FIXTURE_BUDGET * 2 });
    const pool = [
      outgoing, candidate("falscher-tier", { tier: 4, strength: 1 }),
      candidate("falscher-platz", { tier: 5, positions: ["C"], strength: 1 }),
      candidate("stärker", { tier: 5, strength: 30 }), weakest,
    ];
    expect(pickFiller(players, outgoing, pool, "fallback")).toEqual(weakest);
  });

  it("stürzt ohne passenden Tier-5-Spieler nicht ab, sondern nimmt den schwächsten passenden Spieler", () => {
    const outgoing = { ...out, strength: 10 };
    const players = [outgoing, ...lineup.slice(1)];
    const tier4 = candidate("nur-tier-4", { tier: 4, strength: 40 });
    const tier3 = candidate("tier-3", { tier: 3, strength: 60 });
    expect(pickFiller(players, outgoing, [outgoing, tier3, tier4], "kein-tier-5")).toEqual(tier4);
  });
});

function seasonInput(trade: TradeDecision, seedKey = "verletzte-saison"): SeasonInput {
  return { lineup, seedKey, options: { deadline: true, bankruptcy: false }, trade, pool: FIXTURE_POOL };
}

function expectedWin(game: GameResult, players: Player[], seedKey: string): boolean {
  const net = teamRating(players).net;
  const opponent = FIXTURE_TEAMS.find((team) => team.abbr === game.opp)!;
  const advantage = game.home ? CONFIG.sim.homeAdv : -CONFIG.sim.homeAdv;
  const chance = 1 / (1 + Math.exp(-(net - opponent.net + advantage) / CONFIG.sim.scale));
  return makeRng(hash(`${seedKey}|g${game.game}`))() < chance;
}

describe("Trade in der Saison", () => {
  const incoming = candidate("verletzter-neuzugang", {
    cats: { shooter: 99, finisher: 99, playmaking: 99, rebound: 99, defense: 99, oreb: 99, dreb: 99, blk: 99 },
  });
  const decision = { outId: out.id, offer: { player: incoming, injured: true } };

  it.each(["verletzte-saison", "zweite-saison"])("setzt in %s den Füller exakt für Spiele 51 bis 50+N ein", (seedKey) => {
    const input = seasonInput(decision, seedKey);
    const before = structuredClone(input);
    const result = playSeason(input, FIXTURE_TEAMS);
    const duration = injuryGames(seedKey, out.id, incoming.id);
    const filler = pickFiller(lineup, out, FIXTURE_POOL, seedKey);
    const fillerLineup = lineup.map((player) => player.id === out.id ? filler : player);
    const finalLineup = lineup.map((player) => player.id === out.id ? incoming : player);
    expect(result.games.slice(0, 50)).toEqual(playSeason(seasonInput(null, seedKey), FIXTURE_TEAMS).games.slice(0, 50));
    expect(result.games).toHaveLength(82);
    expect(result.wins + result.losses).toBe(82);
    expect(result.status).toBe("done");
    for (const game of result.games.slice(50)) {
      expect(game.win).toBe(expectedWin(game, game.game <= 50 + duration ? fillerLineup : finalLineup, seedKey));
    }
    expect(result.events).toEqual([
      { kind: "deadline", afterGame: 50 },
      { kind: "trade", afterGame: 50, out, in: incoming, injuredGames: duration, filler },
      { kind: "injury-return", afterGame: 50 + duration, player: incoming },
    ]);
    expect(result).toEqual(playSeason(input, FIXTURE_TEAMS));
    expect(input).toEqual(before);
  });

  it("verwendet bei einem gesunden Neuzugang ab Spiel 51 sofort den neuen Kader", () => {
    const input = seasonInput({ ...decision, offer: { player: incoming, injured: false } });
    const result = playSeason(input, FIXTURE_TEAMS);
    const nextLineup = lineup.map((player) => player.id === out.id ? incoming : player);
    for (const game of result.games.slice(50)) expect(game.win).toBe(expectedWin(game, nextLineup, input.seedKey));
    expect(result.events).toEqual([
      { kind: "deadline", afterGame: 50 },
      { kind: "trade", afterGame: 50, out, in: incoming, injuredGames: 0, filler: null },
    ]);
  });

  it.each([31, 32, 33])("meldet bei %i Spielen Ausfall eine Rückkehr nur vor dem Saisonende", (duration) => {
    // Die regulären 3–15 Spiele erreichen die Saisonende-Grenze nicht.
    vi.spyOn(tradeModule, "injuryGames").mockReturnValue(duration);
    const input = seasonInput(decision);
    const result = playSeason(input, FIXTURE_TEAMS);
    const returns = result.events.filter((event) => event.kind === "injury-return");
    expect(returns).toEqual(duration < 32 ? [{ kind: "injury-return", afterGame: 50 + duration, player: incoming }] : []);
    const filler = pickFiller(lineup, out, FIXTURE_POOL, input.seedKey);
    for (const game of result.games.slice(50)) {
      const replacement = game.game <= 50 + duration ? filler : incoming;
      const players = lineup.map((player) => player.id === out.id ? replacement : player);
      expect(game.win).toBe(expectedWin(game, players, input.seedKey));
    }
  });
});
