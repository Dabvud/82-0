import { CONFIG } from "../config";
import { seasonRaw } from "./normalize";
import type { LeagueAvg, SeasonLine } from "./types";

type Line = SeasonLine | LeagueAvg;

function points(l: Line): number {
  return 2 * (l.x2p ?? 0) + 3 * (l.x3p ?? 0) + (l.ftm ?? 0);
}

/** Wurfversuche im True-Shooting-Sinn (Feldwürfe + 0,44 × Freiwürfe), doppelt gezählt. */
function trueShotAttempts(l: Line): number {
  const x2a = l.x2pPct ? (l.x2p ?? 0) / l.x2pPct : 0;
  const x3a = l.x3p && l.x3pPct ? l.x3p / l.x3pPct : 0;
  return 2 * (x2a + x3a + 0.44 * (l.fta ?? 0));
}

/**
 * Saisonwert für die Stärke: Scoring (Punkte relativ zum Ligaschnitt × gedeckelte TS-Effizienz²)
 * plus Playmaking, Rebound und Defense aus den Rohwerten.
 */
export function seasonValue(line: SeasonLine, lg: LeagueAvg): number {
  const m = CONFIG.strengthModel;
  const raw = seasonRaw(line, lg);
  const ts = points(line) / Math.max(1e-9, trueShotAttempts(line));
  const leagueTs = points(lg) / trueShotAttempts(lg);
  const scoring = points(line) / (points(lg) / CONFIG.playersPerTeam) * Math.min(m.effCap, ts / leagueTs) ** 2;
  return m.scoring * scoring + m.playmaking * raw.playmaking
    + m.rebound * (CONFIG.reboundWeights.oreb * raw.oreb + CONFIG.reboundWeights.dreb * raw.dreb)
    + m.defense * (CONFIG.defenseWeights.stl * raw.stl + CONFIG.defenseWeights.blk * raw.blk + raw.allDef);
}

/** Elite je Saison: Quantil der Saisonwerte aller Stammspieler (g ≥ 40, mp ≥ 20; fehlende Minuten zählen als Stammspieler). */
export function eliteBySeason(entries: { season: number; value: number; g: number; mp: number | null | undefined }[],
  quantile: number): Map<number, number> {
  const bySeason = new Map<number, number[]>();
  for (const e of entries) {
    if (e.g < 40 || (e.mp ?? 30) < 20) continue;
    const list = bySeason.get(e.season) ?? [];
    list.push(e.value);
    bySeason.set(e.season, list);
  }
  const elite = new Map<number, number>();
  for (const [season, values] of bySeason) {
    values.sort((a, b) => a - b);
    elite.set(season, values[Math.min(values.length - 1, Math.floor(values.length * quantile))]);
  }
  return elite;
}

/** Auszeichnungen je „bbrefId|Saison“: All-NBA/All-BAA 3/2/1, MVP- und DPOY-Stimmenanteile gewichtet. */
export function accoladesFrom(teams: Record<string, string>[], awards: Record<string, string>[]): Map<string, number> {
  const m = CONFIG.strengthModel;
  const acc = new Map<string, number>();
  const add = (id: string, season: string, x: number) => acc.set(`${id}|${season}`, (acc.get(`${id}|${season}`) ?? 0) + x);
  for (const r of teams) {
    if (r.type !== "All-NBA" && r.type !== "All-BAA") continue;
    const rank = ["1st", "2nd", "3rd"].indexOf(r.number_tm);
    if (rank >= 0) add(r.player_id, r.season, m.allNba[rank]);
  }
  for (const r of awards) {
    if (r.award === "nba mvp") add(r.player_id, r.season, m.mvp * Number(r.share));
    if (r.award === "dpoy") add(r.player_id, r.season, m.dpoy * Number(r.share));
  }
  return acc;
}

/** Bestes Fenster aus bis zu 3 aufeinanderfolgenden gültigen Saisons nach (Wert/Elite + Gewicht × Auszeichnungen). */
export function pickStrengthPeak(seasons: { season: number; g: number; rel: number; acc: number }[], accWeight: number):
  { from: number; to: number; value: number } {
  const valid = [...seasons].filter((s) => s.g >= CONFIG.minGames).sort((a, b) => a.season - b.season);
  const list = valid.length > 0 ? valid : [...seasons].sort((a, b) => a.season - b.season);
  if (list.length === 0) throw new Error("Keine Saison für den Peak vorhanden.");
  const width = Math.min(CONFIG.peakSeasons, list.length);
  let best = { from: list[0].season, to: list[width - 1].season, value: -Infinity };
  for (let start = 0; start + width <= list.length; start++) {
    const w = list.slice(start, start + width);
    const value = w.reduce((sum, s) => sum + s.rel + accWeight * s.acc, 0) / width;
    if (value > best.value) best = { from: w[0].season, to: w[width - 1].season, value };
  }
  return best;
}
