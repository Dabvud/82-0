import { afterEach, describe, expect, it, vi } from "vitest";
import { CONFIG } from "../../src/config";
import * as bankruptcy from "../../src/game/bankruptcy";
import { BANKRUPTCY_REASONS, bankruptcyPlan, bankruptcyVictim } from "../../src/game/bankruptcy";
import { hash, makeRng, randInt } from "../../src/game/rng";
import { playSeason } from "../../src/game/season";
import type { SeasonInput } from "../../src/game/season";
import { canAdd } from "../../src/game/slots";
import * as teamModule from "../../src/game/team";
import { injuryGames } from "../../src/game/trade";
import type { Player, Pos } from "../../src/game/types";
import { FIXTURE_LUXURY_LINE, FIXTURE_TEAMS, makePlayer } from "../helpers/fixtures";

const cap = 164_961_000;
const cost = (roster: Player[]) => roster.reduce((sum, player) => sum + player.price, 0);
const lineup = (["G", "G", "F", "F", "C"] as Pos[]).map((position, index) => makePlayer({
  id: `star-${index}`, name: `Star ${index}`, positions: [position],
  price: cap * (index < 4 ? 0.35 : 0.05), tier: 1, strength: 99,
  cats: { shooter: 99, finisher: 99, playmaking: 99, rebound: 99, defense: 99, oreb: 99, dreb: 99, blk: 99 },
}));
const replacements = (["G", "F", "C"] as Pos[]).map((position) => makePlayer({
  id: `ersatz-${position}`, name: `Ersatz ${position}`, positions: [position], price: cap * 0.03, tier: 5, strength: 10,
  cats: { shooter: 10, finisher: 10, playmaking: 10, rebound: 10, defense: 10, oreb: 10, dreb: 10, blk: 10 },
}));
const pool = [...lineup, ...replacements];
const easyTeams = FIXTURE_TEAMS.map((team) => ({ ...team, net: -1_000_000 }));
const hardTeams = FIXTURE_TEAMS.map((team) => ({ ...team, net: 1_000_000 }));

function input(overrides: Partial<SeasonInput> = {}): SeasonInput {
  return {
    lineup, pool, luxuryLine: FIXTURE_LUXURY_LINE, seedKey: "pleite-saison",
    options: { deadline: false, bankruptcy: true }, ...overrides,
  };
}

function planned(atWins = 60) {
  return vi.spyOn(bankruptcy, "bankruptcyPlan").mockReturnValue({ happens: true, atWins, reasonIndex: 0 });
}

afterEach(() => vi.restoreAllMocks());

describe("Pleiteplan", () => {
  it("enthält die 15 Gründe wörtlich ohne führende Auslassung", () => {
    expect(BANKRUPTCY_REASONS).toEqual([
      "das komplette Teamvermögen in die Kryptowährung „DunkCoin“ gesteckt. Sie ist am selben Abend auf 0 gefallen.",
      "in Phoenix eine Arena aus Eis bauen lassen.",
      "für ein Heimspiel auf dem Mond schon die Rakete angezahlt.",
      "Wackelkopf-Figuren des Maskottchens bestellt und sich dabei um sechs Nullen vertippt.",
      "beim Pokern gegen das eigene Maskottchen alles verloren, inklusive Jacht.",
      "das Passwort fürs Firmenkonto auf T-Shirts drucken lassen und sie mit der T-Shirt-Kanone in die Menge geschossen.",
      "einen Rechtsstreit gegen eine Taube verloren, die unter dem Hallendach wohnt.",
      "„All you can eat – für immer“-Hotdogs verkauft. Ein Fan hat es wörtlich genommen.",
      "jedem Zuschauer ein Auto geschenkt, bei ausverkaufter Halle.",
      "in einen Sneaker investiert, den es nur für den linken Fuß gibt.",
      "eine Privatinsel gekauft, um Freiwürfe ohne Wind zu trainieren. Die Insel war ein Wal.",
      "beim Spendentag „Fairplay“ sein ganzes Vermögen ans gegnerische Team überwiesen.",
      "die Filmrechte an einem Basketballfilm gekauft, in dem nur ein Goldfisch mitspielt.",
      "jeden Abend das Teamlogo als Hologramm auf die Wolken über der Stadt projizieren lassen.",
      "dagegen gewettet, dass sein Team 82-0 geht, und schaut gerade sehr nervös auf die Bilanz.",
    ]);
  });

  it("verwendet die Konfiguration und den vereinbarten Seed", () => {
    expect(CONFIG.bankruptcy).toEqual({ chance: 0.10, minWins: 60, maxWins: 75 });
    const rng = makeRng(hash("plan-test|bankrupt"));
    expect(bankruptcyPlan("plan-test")).toEqual({
      happens: rng() < 0.10, atWins: randInt(rng, 60, 75), reasonIndex: randInt(rng, 0, 14),
    });
  });

  it("liefert über 10 000 Seeds 10 % ± 1 % Pleiten und alle zulässigen Zeitpunkte und Gründe", async () => {
    let count = 0;
    const wins = new Set<number>();
    const reasons = new Set<number>();
    for (let index = 0; index < 10_000; index++) {
      if (index % 200 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
      const plan = bankruptcyPlan(`quote-${index}`);
      expect(plan).toEqual(bankruptcyPlan(`quote-${index}`));
      if (plan.happens) count++;
      wins.add(plan.atWins);
      reasons.add(plan.reasonIndex);
    }
    expect(count).toBeGreaterThanOrEqual(900);
    expect(count).toBeLessThanOrEqual(1100);
    expect([...wins].sort((a, b) => a - b)).toEqual(Array.from({ length: 16 }, (_, index) => 60 + index));
    expect([...reasons].sort((a, b) => a - b)).toEqual(Array.from({ length: 15 }, (_, index) => index));
  });
});

describe("Pleiteopfer", () => {
  it("senkt 145 % auf höchstens 120 % und gibt immer einen der vier 35-%-Spieler ab", async () => {
    const before = structuredClone({ lineup, pool });
    for (let index = 0; index < 1000; index++) {
      if (index % 200 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
      const victim = bankruptcyVictim(lineup, pool, FIXTURE_LUXURY_LINE, `opfer-${index}`)!;
      expect(victim).not.toBeNull();
      expect(victim.out.price).toBe(cap * 0.35);
      expect(cost(lineup) - victim.out.price + victim.in.price).toBeLessThanOrEqual(FIXTURE_LUXURY_LINE);
      expect(victim.in.tier).toBe(5);
      expect(canAdd(lineup.filter((player) => player.id !== victim.out.id), victim.in)).toBe(true);
    }
    expect({ lineup, pool }).toEqual(before);
  });

  it("wählt nach Gehalt gewichtet und unabhängig von Kader- und Poolreihenfolge", async () => {
    const roster = lineup.map((player, index) => ({ ...player, price: index === 0 ? 40 : index === 1 ? 20 : 1 }));
    const replacement = { ...replacements[0], price: 1 };
    let expensive = 0;
    for (let index = 0; index < 10_000; index++) {
      if (index % 200 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
      const seed = `gewicht-${index}`;
      const victim = bankruptcyVictim(roster, [replacement], 44, seed)!;
      expect(victim).not.toBeNull();
      expect(victim).toEqual(bankruptcyVictim([...roster].reverse(), [replacement], 44, seed));
      if (victim.out.id === roster[0].id) expensive++;
    }
    expect(expensive / 10_000).toBeGreaterThan(0.64);
    expect(expensive / 10_000).toBeLessThan(0.69);
    expect(bankruptcyVictim(lineup, pool, FIXTURE_LUXURY_LINE, "reihenfolge"))
      .toEqual(bankruptcyVictim([...lineup].reverse(), [...pool].reverse(), FIXTURE_LUXURY_LINE, "reihenfolge"));
  });

  it("nimmt den billigsten passenden Tier-5-Spieler und erlaubt eine neue Platzzuordnung", () => {
    const roster = lineup.map((player, index) => ({
      ...player, price: index === 0 ? 40 : 1,
      positions: index === 2 ? ["G", "F"] as Pos[] : player.positions,
    }));
    const cheap = { ...replacements[1], price: 1 };
    const wrongTier = { ...cheap, id: "tier-4", tier: 4 as const, price: 0 };
    const expensive = { ...cheap, id: "teurer", price: 2 };
    const victim = bankruptcyVictim(roster, [wrongTier, expensive, cheap, roster[0]], 5, "flexibel")!;
    expect(victim.out).toEqual(roster[0]);
    expect(victim.in).toEqual(cheap);
    expect(canAdd(roster.filter((player) => player.id !== victim.out.id), cheap)).toBe(true);
  });

  it("akzeptiert die exakte Luxusgrenze und lehnt einen Dollar darüber ab", () => {
    const replacement = replacements[0];
    const boundary = cost(lineup) - lineup[0].price + replacement.price;
    expect(bankruptcyVictim(lineup, [replacement], boundary, "grenze")).not.toBeNull();
    expect(bankruptcyVictim(lineup, [replacement], boundary - 1, "grenze")).toBeNull();
  });

  it("liefert ohne passenden Ersatz oder ausreichende Entlastung null", () => {
    expect(bankruptcyVictim(lineup, [], FIXTURE_LUXURY_LINE, "leer")).toBeNull();
    expect(bankruptcyVictim(lineup, lineup, FIXTURE_LUXURY_LINE, "kader")).toBeNull();
    expect(bankruptcyVictim(lineup, [replacements[2]], FIXTURE_LUXURY_LINE, "center")).toBeNull();
    expect(bankruptcyVictim(lineup, pool, 1, "zu-teuer")).toBeNull();
  });
});

describe("Pleite in der Saison", () => {
  it("erzeugt bei höchstens 120 % über 1000 Seeds kein Ereignis", async () => {
    const roster = lineup.map((player) => ({ ...player, price: FIXTURE_LUXURY_LINE / 5 }));
    for (let index = 0; index < 1000; index++) {
      if (index % 200 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
      const result = playSeason(input({ lineup: roster, seedKey: `unter-grenze-${index}` }), easyTeams);
      expect(result.events.filter((event) => event.kind === "bankrupt")).toEqual([]);
    }
  });

  it("meldet genau am geplanten Sieg den vollständigen Satz und nutzt dauerhaft den Ersatz", () => {
    planned();
    const season = input();
    const before = structuredClone(season);
    const ratings = vi.spyOn(teamModule, "teamRating");
    const victim = bankruptcyVictim(lineup, pool, FIXTURE_LUXURY_LINE, `${season.seedKey}|victim|60`)!;
    const result = playSeason(season, easyTeams);
    expect(result.events).toEqual([{
      kind: "bankrupt", afterGame: 60, ...victim,
      reason: `Der Owner ist pleite! Er hat ${BANKRUPTCY_REASONS[0]} ${victim.out.name} muss das Team verlassen, ${victim.in.name} übernimmt.`,
    }]);
    expect(ratings).toHaveBeenCalledTimes(2);
    expect(ratings.mock.calls[1][0]).toEqual(lineup.map((player) => player.id === victim.out.id ? victim.in : player));
    expect(result).toEqual(playSeason(season, easyTeams));
    expect(season).toEqual(before);
  });

  it("verwendet den echten Plan und wartet bei Niederlagen auf die geplante Siegzahl", () => {
    const season = input({ seedKey: "quote-0" });
    const teams = FIXTURE_TEAMS.map((team) => ({ ...team, net: teamModule.teamRating(lineup).net - 25 }));
    // Ein fester Treffer wird unter den deterministischen Plänen gesucht.
    for (let index = 0; !bankruptcyPlan(season.seedKey).happens || bankruptcyPlan(season.seedKey).atWins > 65; index++) {
      season.seedKey = `quote-${index + 1}`;
    }
    const baseline = playSeason({ ...season, options: { deadline: false, bankruptcy: false } }, teams);
    const plan = bankruptcyPlan(season.seedKey);
    expect(baseline.wins).toBeGreaterThanOrEqual(plan.atWins);
    const afterGame = baseline.games.filter((game) => game.win)[plan.atWins - 1].game;
    expect(afterGame).toBeGreaterThan(plan.atWins);
    const result = playSeason(season, teams);
    const victim = bankruptcyVictim(lineup, pool, FIXTURE_LUXURY_LINE, `${season.seedKey}|victim|${afterGame}`)!;
    expect(result.events).toEqual([{
      kind: "bankrupt", afterGame, ...victim,
      reason: `Der Owner ist pleite! Er hat ${BANKRUPTCY_REASONS[plan.reasonIndex]} ${victim.out.name} muss das Team verlassen, ${victim.in.name} übernimmt.`,
    }]);
    expect(result.games.slice(0, afterGame)).toEqual(baseline.games.slice(0, afterGame));
    const roster = lineup.map((player) => player.id === victim.out.id ? victim.in : player);
    const net = teamModule.teamRating(roster).net;
    for (const game of result.games.slice(afterGame)) {
      const opponent = teams.find((team) => team.abbr === game.opp)!;
      const chance = 1 / (1 + Math.exp(-(net - opponent.net + (game.home ? CONFIG.sim.homeAdv : -CONFIG.sim.homeAdv)) / CONFIG.sim.scale));
      expect(game.win).toBe(makeRng(hash(`${season.seedKey}|g${game.game}`))() < chance);
    }
  });

  it("erzeugt ohne Ersatz kein Ereignis und stürzt nicht ab", () => {
    planned();
    const victim = vi.spyOn(bankruptcy, "bankruptcyVictim");
    const result = playSeason(input({ pool: [] }), easyTeams);
    expect(result.games).toHaveLength(82);
    expect(result.events).toEqual([]);
    expect(victim).toHaveBeenCalledTimes(1);
  });

  it("beachtet Option, ausbleibende Auslosung und eine nicht erreichte Siegzahl", () => {
    const plan = planned();
    expect(playSeason(input({ options: { deadline: false, bankruptcy: false } }), easyTeams).events).toEqual([]);
    plan.mockReturnValue({ happens: false, atWins: 60, reasonIndex: 0 });
    expect(playSeason(input(), easyTeams).events).toEqual([]);
    plan.mockReturnValue({ happens: true, atWins: 60, reasonIndex: 0 });
    expect(playSeason(input(), hardTeams).events).toEqual([]);
  });

  it.each([true, false])("bewertet nach einem Trade das aktuelle Gehalt (Risiko danach: %s)", (risky) => {
    planned();
    const roster = lineup.map((player) => ({ ...player, price: cap * (risky ? 0.24 : 0.26) }));
    const incoming = { ...roster[0], id: "neuzugang", price: cap * (risky ? 0.35 : 0.05) };
    const result = playSeason(input({
      lineup: roster, options: { deadline: true, bankruptcy: true },
      trade: { outId: roster[0].id, offer: { player: incoming, injured: false } },
    }), easyTeams);
    const events = result.events.filter((event) => event.kind === "bankrupt");
    expect(events).toHaveLength(risky ? 1 : 0);
    expect(events.some((event) => event.out.id === roster[0].id)).toBe(false);
  });

  it.each(["neuzugang", "anderer"])("zählt den verletzten Neuzugang und bewahrt den Ersatz bei Opfer %s", (which) => {
    planned();
    const incoming = { ...lineup[0], id: "verletzter-neuzugang", name: "Verletzter Star", price: cap * 0.35 };
    let seedKey = "verletzung-0";
    for (let index = 0; injuryGames(seedKey, lineup[0].id, incoming.id) < 11; index++) seedKey = `verletzung-${index + 1}`;
    const duration = injuryGames(seedKey, lineup[0].id, incoming.id);
    const roster = lineup.map((player, index) => ({ ...player, price: cap * (index === 0 ? 0.05 : index < 4 ? 0.25 : 0.15) }));
    // Der Füller kostet absichtlich mehr als der verletzte Star, wird aber nicht bezahlt.
    const filler = { ...replacements[0], price: cap * 0.9 };
    const localPool = [filler, replacements[1]];
    const out = which === "neuzugang" ? incoming : roster[2];
    const replacement = which === "neuzugang" ? replacements[0] : replacements[1];
    const victim = vi.spyOn(bankruptcy, "bankruptcyVictim").mockReturnValue({ out, in: replacement });
    const ratings = vi.spyOn(teamModule, "teamRating");
    const result = playSeason(input({
      lineup: roster, pool: localPool, seedKey, options: { deadline: true, bankruptcy: true },
      trade: { outId: roster[0].id, offer: { player: incoming, injured: true } },
    }), easyTeams);
    const paidRoster = roster.map((player, index) => index === 0 ? incoming : player);
    expect(victim).toHaveBeenCalledExactlyOnceWith(paidRoster, localPool, FIXTURE_LUXURY_LINE, `${seedKey}|victim|60`);
    expect(result.events.filter((event) => event.kind === "injury-return"))
      .toEqual(which === "neuzugang" ? [] : [{ kind: "injury-return", afterGame: 50 + duration, player: incoming }]);
    const finalRoster = paidRoster.map((player) => player.id === out.id ? replacement : player);
    expect(ratings.mock.calls.at(-1)?.[0]).toEqual(finalRoster);
    const afterBankruptcy = roster.map((player, index) => index === 0 ? filler : player)
      .map((player) => player.id === out.id || (which === "neuzugang" && player.id === filler.id) ? replacement : player);
    expect(ratings.mock.calls[2][0]).toEqual(afterBankruptcy);
  });

  it("zählt bei einem teuren Lückenfüller ausschließlich das niedrigere Gehalt des Neuzugangs", () => {
    planned();
    const roster = lineup.map((player) => ({ ...player, price: cap * 0.2 }));
    const incoming = { ...roster[0], id: "guenstiger-neuzugang" };
    let seedKey = "teurer-fueller-0";
    for (let index = 0; injuryGames(seedKey, roster[0].id, incoming.id) < 11; index++) seedKey = `teurer-fueller-${index + 1}`;
    const result = playSeason(input({
      lineup: roster, pool: [{ ...replacements[0], price: cap }], seedKey,
      options: { deadline: true, bankruptcy: true },
      trade: { outId: roster[0].id, offer: { player: incoming, injured: true } },
    }), easyTeams);
    expect(result.events.filter((event) => event.kind === "bankrupt")).toEqual([]);
  });
});
