import { CONFIG } from "../config";
import type { Player } from "./types";

export interface Note {
  kind: "good" | "warn";
  text: string;
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function teamRating(players: Player[]): { net: number; off: number; def: number; talent: number; notes: Note[] } {
  const config = CONFIG.team;
  // Eine feste Reihenfolge verhindert selbst kleinste Rundungsunterschiede beim Summieren.
  const roster = [...players].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const shooters = roster.filter((p) => p.cats.shooter >= config.shooterMin).length;
  const spacing = shooters >= config.spacingMinShooters ? 1 : config.spacingFactor;
  const scores = roster.map((p) => (p.cats.shooter + p.cats.finisher * spacing) / config.scoringDivisor)
    .sort((a, b) => b - a);
  const weights = config.scoringWeights.slice(0, scores.length);
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const scoring = weightSum === 0 ? 0
    : scores.reduce((sum, score, index) => sum + score * weights[index], 0) / weightSum;
  const playmakers = roster.map((p) => p.cats.playmaking).sort((a, b) => b - a);
  const [first, second, rest] = config.playmakingWeights;
  const playmaking = (playmakers[0] ?? 0) * first + (playmakers[1] ?? 0) * second + mean(playmakers.slice(2)) * rest;
  const defense = mean(roster.map((p) => p.cats.defense));
  const missingPlaymaker = (playmakers[0] ?? 0) < config.playmakerMin;
  const missingRim = !roster.some((p) => p.cats.blk >= config.rimMin);
  const off = (scoring - config.baseline) * config.scoringScale
    + (playmaking - config.baseline) * config.playmakingScale
    + (mean(roster.map((p) => p.cats.oreb)) - config.baseline) * config.orebScale;
  const def = (defense - config.baseline) * config.defenseScale
    + (mean(roster.map((p) => p.cats.dreb)) - config.baseline) * config.drebScale;
  const talent = (mean(roster.map((p) => p.strength)) - config.baseline) * config.talentScale;
  const net = off + def + talent - (missingPlaymaker ? config.noPlaymakerPenalty : 0) - (missingRim ? config.noRimPenalty : 0);
  const notes: Note[] = [];
  if (missingPlaymaker) notes.push({ kind: "warn", text: "⚠️ Kein Ballverteiler" });
  if (missingRim) notes.push({ kind: "warn", text: "⚠️ Kein Rim Protector" });
  if (shooters < config.spacingMinShooters) notes.push({ kind: "warn", text: "⚠️ Zu wenig Spacing" });
  if (shooters >= config.strongSpacingMinShooters) notes.push({ kind: "good", text: "✅ Starkes Spacing" });
  if (defense >= config.eliteDefenseMin) notes.push({ kind: "good", text: "✅ Elite-Defense" });
  if (mean(roster.map((p) => p.cats.rebound)) >= config.strongReboundMin) notes.push({ kind: "good", text: "✅ Rebound-Maschine" });
  return { net, off, def, talent, notes };
}
