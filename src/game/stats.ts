import { CONFIG } from "../config";
import { isCalendarDate } from "./daily";
import { tierLabel } from "./season";
import type { SeasonLog } from "./season";

export type Label = ReturnType<typeof tierLabel>;
export interface Stats {
  seasons: number;
  totalWins: number;
  best: { wins: number; losses: number } | null;
  perfect: number;
  byTier: Record<Label, number>;
  dailyStreak: number;
  lastDaily: string | null;
}

export function emptyStats(): Stats {
  return { seasons: 0, totalWins: 0, best: null, perfect: 0,
    byTier: { "Enttäuschung": 0, Playoffs: 0, Contender: 0, "Warriors-Rekord geknackt": 0, Perfektion: 0 },
    dailyStreak: 0, lastDaily: null };
}

export function recordSeason(stats: Stats, log: SeasonLog, mode: "daily" | "free", date: string | null): Stats {
  if (log.status !== "done" || !Number.isInteger(log.wins) || !Number.isInteger(log.losses)
    || log.wins < 0 || log.losses < 0 || log.wins + log.losses !== CONFIG.sim.seasonGames) return stats;
  // Tagesrätsel werden chronologisch erfasst; erneutes Laden darf nie doppelt zählen.
  if (mode === "daily" && (!isCalendarDate(date) || (stats.lastDaily !== null && date <= stats.lastDaily))) return stats;
  let dailyStreak = stats.dailyStreak;
  if (mode === "daily") {
    const consecutive = stats.lastDaily !== null
      && Date.parse(`${date}T00:00:00Z`) - Date.parse(`${stats.lastDaily}T00:00:00Z`) === 86_400_000;
    dailyStreak = consecutive ? dailyStreak + 1 : 1;
  }
  const label = tierLabel(log.wins);
  return { seasons: stats.seasons + 1, totalWins: stats.totalWins + log.wins,
    best: stats.best === null || log.wins > stats.best.wins ? { wins: log.wins, losses: log.losses } : stats.best,
    perfect: stats.perfect + Number(log.wins === CONFIG.sim.seasonGames),
    byTier: { ...stats.byTier, [label]: stats.byTier[label] + 1 }, dailyStreak,
    lastDaily: mode === "daily" ? date : stats.lastDaily };
}
