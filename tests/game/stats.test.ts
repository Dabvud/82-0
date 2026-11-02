import { describe, expect, it } from "vitest";
import { emptyStats, recordSeason } from "../../src/game/stats";
import type { SeasonLog } from "../../src/game/season";

const log = (wins: number, status: SeasonLog["status"] = "done"): SeasonLog => ({
  wins, losses: (status === "done" ? 82 : 50) - wins, status, games: [], events: [],
});

describe("Statistik", () => {
  it("zählt Bilanz, Bestwert, perfekte Saisons und Stufen ohne die Eingabe zu verändern", () => {
    const initial = emptyStats();
    const a = recordSeason(initial, log(74), "free", null);
    const b = recordSeason(a, log(82), "free", null);
    const c = recordSeason(b, log(60), "free", null);
    expect(initial.seasons).toBe(0);
    expect(c).toMatchObject({ seasons: 3, totalWins: 216, best: { wins: 82, losses: 0 }, perfect: 1, dailyStreak: 0, lastDaily: null });
    expect(c.byTier).toEqual({ "Enttäuschung": 0, Playoffs: 1, Contender: 0, "Warriors-Rekord geknackt": 1, Perfektion: 1 });
  });

  it("erhöht die Tages-Serie an Folgetagen und setzt sie bei einer Lücke zurück", () => {
    const a = recordSeason(emptyStats(), log(50), "daily", "2026-10-24");
    const b = recordSeason(a, log(60), "daily", "2026-10-25");
    const c = recordSeason(b, log(70), "daily", "2026-10-27");
    expect(b.dailyStreak).toBe(2);
    expect(c.dailyStreak).toBe(1);
    expect(c.lastDaily).toBe("2026-10-27");
  });

  it("zählt denselben Tag auch nach einer freien Runde kein zweites Mal", () => {
    const a = recordSeason(emptyStats(), log(74), "daily", "2026-11-02");
    const b = recordSeason(a, log(60), "free", null);
    expect(recordSeason(b, log(82), "daily", "2026-11-02")).toEqual(b);
    const c = recordSeason(b, log(70), "daily", "2026-11-03");
    expect(recordSeason(c, log(82), "daily", "2026-11-02")).toEqual(c);
  });

  it("ignoriert unfertige Saisons und Tagesergebnisse ohne gültiges Datum", () => {
    const stats = emptyStats();
    expect(recordSeason(stats, log(40, "deadline"), "daily", "2026-11-02")).toBe(stats);
    for (const date of [null, "kaputt", "2026-02-30"]) expect(recordSeason(stats, log(60), "daily", date)).toBe(stats);
  });
});
