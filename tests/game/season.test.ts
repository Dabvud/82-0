import { describe, expect, it } from "vitest";
import { playSeason, tierLabel } from "../../src/game/season";
import type { GameResult, SeasonInput } from "../../src/game/season";
import { buildSchedule } from "../../src/game/schedule";
import { teamRating } from "../../src/game/team";
import { hash, makeRng } from "../../src/game/rng";
import type { Player, TradeDecision, TradeOffer } from "../../src/game/types";
import { FIXTURE_POOL, FIXTURE_TEAMS, makePlayer } from "../helpers/fixtures";

const lineup = [24, 25, 29, 30, 33].map((index) => FIXTURE_POOL[index]);
const incoming = makePlayer({
  id: "neuzugang", positions: ["G"],
  cats: { shooter: 99, finisher: 99, playmaking: 99, rebound: 99, defense: 99, oreb: 99, dreb: 99, blk: 99 },
});
const offer: TradeOffer = { player: incoming, injured: false };
const trade: TradeDecision = { outId: lineup[0].id, offer };

function input(overrides: Partial<SeasonInput> = {}): SeasonInput {
  return { lineup, seedKey: "free|saison-test", options: { deadline: false, bankruptcy: false }, pool: FIXTURE_POOL, ...overrides };
}

function expectedWin(game: GameResult, players: Player[], seedKey: string): boolean {
  const net = teamRating(players).net;
  const oppNet = FIXTURE_TEAMS.find((team) => team.abbr === game.opp)!.net;
  const chance = 1 / (1 + Math.exp(-(net - oppNet + (game.home ? 1.5 : -1.5)) / 4));
  return makeRng(hash(`${seedKey}|g${game.game}`))() < chance;
}

describe("Saison-Engine", () => {
  it("liefert bei gleicher Eingabe identische Logs und bei anderem Seed andere Ergebnisse", () => {
    const season = input();
    const result = playSeason(season, FIXTURE_TEAMS);
    expect(result).toEqual(playSeason(season, FIXTURE_TEAMS));
    expect(result.games.map((game) => game.win)).not.toEqual(
      playSeason(input({ seedKey: "free|anderer-seed" }), FIXTURE_TEAMS).games.map((game) => game.win),
    );
  });

  it("spielt ohne Deadline 82 Spiele und zählt Siege und Niederlagen konsistent", () => {
    const result = playSeason(input(), FIXTURE_TEAMS);
    expect(result.status).toBe("done");
    expect(result.games).toHaveLength(82);
    expect(result.games.map(({ game, opp, home }) => ({ game, opp, home }))).toEqual(buildSchedule(input().seedKey, FIXTURE_TEAMS));
    expect(result.wins).toBe(result.games.filter((game) => game.win).length);
    expect(result.losses).toBe(82 - result.wins);
    expect(result.events).toEqual([]);
  });

  it("verwendet die vereinbarte Siegchance, Heimvorteil und einen unabhängigen Seed pro Spiel", () => {
    const season = input();
    for (const game of playSeason(season, FIXTURE_TEAMS).games) {
      expect(game.win).toBe(expectedWin(game, lineup, season.seedKey));
    }
  });

  it("pausiert mit ausstehender Entscheidung exakt nach Spiel 50", () => {
    const paused = playSeason(input({ options: { deadline: true, bankruptcy: false }, trade: "pending" }), FIXTURE_TEAMS);
    expect(paused.status).toBe("deadline");
    expect(paused.games).toHaveLength(50);
    expect(paused.games.at(-1)?.game).toBe(50);
    expect(paused.wins + paused.losses).toBe(50);
    expect(paused.events).toEqual([{ kind: "deadline", afterGame: 50 }]);
    expect(paused.games).toEqual(playSeason(input(), FIXTURE_TEAMS).games.slice(0, 50));
  });

  it.each([null, undefined])("beendet die Saison mit Deadline ohne Trade (%s)", (decision) => {
    const result = playSeason(input({ options: { deadline: true, bankruptcy: false }, trade: decision }), FIXTURE_TEAMS);
    expect(result.status).toBe("done");
    expect(result.games).toHaveLength(82);
    expect(result.games).toEqual(playSeason(input(), FIXTURE_TEAMS).games);
    expect(result.events).toEqual([{ kind: "deadline", afterGame: 50 }]);
  });

  it("wendet den übergebenen Trade erst ab Spiel 51 an und bewahrt die ersten 50 Ergebnisse", () => {
    const season = input({ options: { deadline: true, bankruptcy: false }, trade });
    const result = playSeason(season, FIXTURE_TEAMS);
    const withoutTrade = playSeason(input(), FIXTURE_TEAMS);
    const nextLineup = lineup.map((p) => p.id === trade.outId ? incoming : p);
    expect(result.games.slice(0, 50)).toEqual(withoutTrade.games.slice(0, 50));
    expect(result.games.slice(50)).not.toEqual(withoutTrade.games.slice(50));
    for (const game of result.games.slice(50)) expect(game.win).toBe(expectedWin(game, nextLineup, season.seedKey));
    expect(result.status).toBe("done");
    expect(result.games).toHaveLength(82);
    expect(result.wins + result.losses).toBe(82);
    expect(result.events).toEqual([
      { kind: "deadline", afterGame: 50 },
      { kind: "trade", afterGame: 50, out: lineup[0], in: incoming, injuredGames: 0, filler: null },
    ]);
  });

  it("markiert einen verletzten Neuzugang mit unbekannter Ausfallzeit ohne erfundene Verletzungslogik", () => {
    const options = { deadline: true, bankruptcy: false };
    const result = playSeason(input({ options, trade: { outId: trade.outId, offer: { ...offer, injured: true } } }), FIXTURE_TEAMS);
    expect(result.events).toContainEqual({ kind: "trade", afterGame: 50, out: lineup[0], in: incoming, injuredGames: null, filler: null });
    expect(result.events.some((event) => event.kind === "injury-return")).toBe(false);
    expect(result.games).toEqual(playSeason(input({ options, trade }), FIXTURE_TEAMS).games);
  });

  it.each(["pending", trade] as const)("ignoriert Trade-Entscheidungen bei ausgeschalteter Deadline (%s)", (decision) => {
    expect(playSeason(input({ trade: decision }), FIXTURE_TEAMS)).toEqual(playSeason(input(), FIXTURE_TEAMS));
  });

  it("ignoriert die Pleite-Option bis Task 11", () => {
    expect(playSeason(input({ options: { deadline: false, bankruptcy: true } }), FIXTURE_TEAMS))
      .toEqual(playSeason(input(), FIXTURE_TEAMS));
  });

  it("ist unabhängig von der Kaderreihenfolge und verändert weder Eingaben noch Gegner", () => {
    const season = input({ options: { deadline: true, bankruptcy: true }, trade });
    const before = structuredClone(season);
    const teamsBefore = structuredClone(FIXTURE_TEAMS);
    expect(playSeason({ ...season, lineup: [...lineup].reverse() }, FIXTURE_TEAMS)).toEqual(playSeason(season, FIXTURE_TEAMS));
    expect(season).toEqual(before);
    expect(FIXTURE_TEAMS).toEqual(teamsBefore);
  });

  it("gewinnt mit 40 Punkten Vorsprung praktisch alles und mit 40 Punkten Rückstand praktisch nichts", async () => {
    const net = teamRating(lineup).net;
    const weakOpponents = FIXTURE_TEAMS.map((team) => ({ ...team, net: net - 40 }));
    const strongOpponents = FIXTURE_TEAMS.map((team) => ({ ...team, net: net + 40 }));
    for (let index = 0; index < 1000; index++) {
      if (index % 200 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
      const season = input({ seedKey: `extrem-${index}` });
      expect(playSeason(season, weakOpponents).wins).toBeGreaterThanOrEqual(80);
      expect(playSeason(season, strongOpponents).wins).toBeLessThanOrEqual(2);
    }
  });
});

describe("Ergebnisstufen", () => {
  it.each([
    [0, "Enttäuschung"], [59, "Enttäuschung"], [60, "Playoffs"], [69, "Playoffs"],
    [70, "Contender"], [73, "Contender"], [74, "Warriors-Rekord geknackt"],
    [81, "Warriors-Rekord geknackt"], [82, "Perfektion"],
  ] as const)("ordnet %i Siege der Stufe %s zu", (wins, label) => {
    expect(tierLabel(wins)).toBe(label);
  });
});
