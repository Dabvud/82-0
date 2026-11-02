import { CONFIG } from "../config";
import { hash, makeRng, shuffle } from "./rng";
import type { NbaTeam } from "./types";

export interface ScheduledGame {
  game: number;
  opp: string;
  home: boolean;
}

export function buildSchedule(seed: string, teams: NbaTeam[]): ScheduledGame[] {
  if (teams.length !== CONFIG.sim.teamCount || new Set(teams.map((team) => team.abbr)).size !== teams.length) {
    throw new Error(`Der Spielplan benötigt ${CONFIG.sim.teamCount} verschiedene Gegner.`);
  }
  const rng = makeRng(hash(`${seed}|schedule`));
  const extra = shuffle(rng, teams).slice(0, CONFIG.sim.extraOpponents);
  const pairs = [...teams, ...extra].flatMap((team) => [
    { opp: team.abbr, home: true },
    { opp: team.abbr, home: false },
  ]);
  return shuffle(rng, pairs).map((game, index) => ({ game: index + 1, ...game }));
}
