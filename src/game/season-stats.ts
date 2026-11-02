import type { SeasonLog } from "./season";
import { teamRating } from "./team";
import type { NbaTeam, Player } from "./types";

export interface Record2 { wins: number; losses: number }
export interface SeasonStats {
  longestStreak: number;
  vsTop10: Record2;
  /** Teamstärke der Start-Five (Net Rating, gleiche Skala wie die echten Teams). */
  net: number;
  off: number;
  def: number;
  bestTeam: { name: string; net: number };
  /** Summe der Peak-Werte der Five pro Spiel; Dreierquote aus allen Treffern ÷ Versuchen. */
  box: { pts: number; reb: number; ast: number; stl: number; blk: number; fg3m: number; fg3pct: number };
}

function record(games: SeasonLog["games"]): Record2 {
  const wins = games.filter((g) => g.win).length;
  return { wins, losses: games.length - wins };
}

/** Kennzahlen für die Ergebnis-Tafel: wie dominant war die Saison? */
export function seasonStats(log: SeasonLog, lineup: Player[], teams: NbaTeam[]): SeasonStats {
  let streak = 0;
  let longestStreak = 0;
  for (const game of log.games) {
    streak = game.win ? streak + 1 : 0;
    longestStreak = Math.max(longestStreak, streak);
  }
  const ranked = [...teams].sort((a, b) => b.net - a.net);
  const top10 = new Set(ranked.slice(0, 10).map((t) => t.abbr));
  const { net, off, def } = teamRating(lineup);
  return {
    longestStreak,
    vsTop10: record(log.games.filter((g) => top10.has(g.opp))),
    net, off, def,
    bestTeam: { name: ranked[0]?.name ?? "–", net: ranked[0]?.net ?? 0 },
    box: boxTotals(lineup),
  };
}

function boxTotals(lineup: Player[]): SeasonStats["box"] {
  const sum = (k: keyof Player["box"]) => Math.round(lineup.reduce((t, p) => t + p.box[k], 0) * 10) / 10;
  const attempts = lineup.reduce((t, p) => t + p.box.fg3a, 0);
  return {
    pts: sum("pts"), reb: sum("reb"), ast: sum("ast"), stl: sum("stl"), blk: sum("blk"), fg3m: sum("fg3m"),
    fg3pct: attempts > 0 ? Math.round(lineup.reduce((t, p) => t + p.box.fg3m, 0) / attempts * 1000) / 1000 : 0,
  };
}
