import { describe, expect, it } from "vitest";
import type { SeasonLog } from "../../src/game/season";
import { seasonStats } from "../../src/game/season-stats";
import { teamRating } from "../../src/game/team";
import { FIXTURE_POOL, FIXTURE_TEAMS } from "../helpers/fixtures";

const byNet = [...FIXTURE_TEAMS].sort((a, b) => b.net - a.net);
const top = byNet[0];
const weak = byNet[29];

function log(games: [string, boolean, boolean][]): SeasonLog {
  const list = games.map(([opp, home, win], i) => ({ game: i + 1, opp, home, win }));
  const wins = list.filter((g) => g.win).length;
  return { games: list, events: [], wins, losses: list.length - wins, status: "done" };
}

describe("seasonStats", () => {
  const lineup = FIXTURE_POOL.slice(0, 5);
  const season = log([
    [top.abbr, true, true], [weak.abbr, false, true], [weak.abbr, true, true],
    [top.abbr, false, false], [weak.abbr, true, true], [weak.abbr, false, true],
  ]);
  const stats = seasonStats(season, lineup, FIXTURE_TEAMS);

  it("findet die längste Siegesserie", () => {
    expect(stats.longestStreak).toBe(3);
  });

  it("zählt die Peak-Werte der Five pro Spiel zusammen und berechnet die Dreierquote aus Treffern und Versuchen", () => {
    const five = [1, 2, 3, 4, 5].map((n) => ({ ...lineup[0], id: "p" + n,
      box: { pts: 20, reb: n, ast: 5, stl: 1, blk: 0.5, fg3m: 2, fg3a: 5 } }));
    const box = seasonStats(season, five, FIXTURE_TEAMS).box;
    expect(box).toEqual({ pts: 100, reb: 15, ast: 25, stl: 5, blk: 2.5, fg3m: 10, fg3pct: 0.4 });
  });

  it("zählt die Bilanz gegen die zehn stärksten Teams der Liga", () => {
    expect(stats.vsTop10).toEqual({ wins: 1, losses: 1 });
  });

  it("nennt Teamstärke, Offensive, Defensive und das beste echte Team zum Vergleich", () => {
    const rating = teamRating(lineup);
    expect(stats.net).toBeCloseTo(rating.net);
    expect(stats.off).toBeCloseTo(rating.off);
    expect(stats.def).toBeCloseTo(rating.def);
    expect(stats.bestTeam).toEqual({ name: top.name, net: top.net });
  });
});
