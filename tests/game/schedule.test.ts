import { describe, expect, it } from "vitest";
import { buildSchedule } from "../../src/game/schedule";
import { FIXTURE_TEAMS } from "../helpers/fixtures";

describe("Spielplan", () => {
  it("verwendet 30 eindeutige Testgegner mit Netto-Ratings von −10 bis +10", () => {
    expect(FIXTURE_TEAMS).toHaveLength(30);
    expect(new Set(FIXTURE_TEAMS.map((team) => team.abbr)).size).toBe(30);
    expect(Math.min(...FIXTURE_TEAMS.map((team) => team.net))).toBe(-10);
    expect(Math.max(...FIXTURE_TEAMS.map((team) => team.net))).toBe(10);
  });

  it("liefert über viele Seeds 82 nummerierte Spiele, 41 Heimspiele und elf doppelte Gegnerpaare", async () => {
    for (let index = 0; index < 1000; index++) {
      if (index % 200 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
      const schedule = buildSchedule(`spielplan-${index}`, FIXTURE_TEAMS);
      expect(schedule.map((game) => game.game)).toEqual(Array.from({ length: 82 }, (_, i) => i + 1));
      expect(schedule.filter((game) => game.home)).toHaveLength(41);
      expect(new Set(schedule.map((game) => game.opp))).toEqual(new Set(FIXTURE_TEAMS.map((team) => team.abbr)));
      let doubled = 0;
      for (const team of FIXTURE_TEAMS) {
        const games = schedule.filter((game) => game.opp === team.abbr);
        expect([2, 4]).toContain(games.length);
        expect(games.filter((game) => game.home)).toHaveLength(games.length / 2);
        if (games.length === 4) doubled++;
      }
      expect(doubled).toBe(11);
    }
  });

  it("mischt deterministisch und verändert die Gegnerliste nicht", () => {
    const before = structuredClone(FIXTURE_TEAMS);
    const schedule = buildSchedule("gleich", FIXTURE_TEAMS);
    expect(schedule).toEqual(buildSchedule("gleich", FIXTURE_TEAMS));
    expect(schedule).not.toEqual(buildSchedule("anders", FIXTURE_TEAMS));
    expect(FIXTURE_TEAMS).toEqual(before);
  });
});
