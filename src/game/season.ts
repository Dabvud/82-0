import { CONFIG } from "../config";
import { hash, makeRng } from "./rng";
import { buildSchedule } from "./schedule";
import { teamRating } from "./team";
import type { NbaTeam, Player, TradeDecision } from "./types";

export interface SeasonOptions {
  deadline: boolean;
  bankruptcy: boolean;
}

export interface SeasonInput {
  lineup: Player[];
  seedKey: string;
  options: SeasonOptions;
  trade?: TradeDecision | "pending";
  pool: Player[];
}

export type SeasonEvent =
  | { kind: "deadline"; afterGame: 50 }
  | { kind: "trade"; afterGame: 50; out: Player; in: Player; injuredGames: number | null; filler: Player | null }
  | { kind: "injury-return"; afterGame: number; player: Player }
  | { kind: "bankrupt"; afterGame: number; out: Player; in: Player; reason: string };

export interface GameResult {
  game: number;
  opp: string;
  home: boolean;
  win: boolean;
}

export interface SeasonLog {
  games: GameResult[];
  events: SeasonEvent[];
  wins: number;
  losses: number;
  status: "deadline" | "done";
}

export function playSeason(input: SeasonInput, teams: NbaTeam[]): SeasonLog {
  const { lineup, seedKey, options } = input;
  const schedule = buildSchedule(seedKey, teams);
  const opponents = new Map(teams.map((team) => [team.abbr, team.net]));
  const trade = options.deadline && input.trade !== "pending" ? input.trade : null;
  const outgoing = trade ? lineup.find((p) => p.id === trade.outId) : undefined;
  if (trade && !outgoing) throw new Error("Der abgegebene Spieler gehört nicht zum Kader.");
  const tradedLineup = trade ? lineup.map((p) => p.id === trade.outId ? trade.offer.player : p) : lineup;

  // Task 10 erweitert hier die Kaderwahl um Ausfallzeit und Lückenfüller.
  function rosterForGame(game: number): Player[] {
    return game > CONFIG.sim.deadlineAfterGame ? tradedLineup : lineup;
  }

  const log: SeasonLog = { games: [], events: [], wins: 0, losses: 0, status: "done" };
  let currentRoster = lineup;
  let net = teamRating(currentRoster).net;
  for (const game of schedule) {
    const roster = rosterForGame(game.game);
    if (roster !== currentRoster) {
      currentRoster = roster;
      net = teamRating(roster).net;
    }
    const homeAdv = game.home ? CONFIG.sim.homeAdv : -CONFIG.sim.homeAdv;
    const chance = 1 / (1 + Math.exp(-(net - opponents.get(game.opp)! + homeAdv) / CONFIG.sim.scale));
    const win = makeRng(hash(`${seedKey}|g${game.game}`))() < chance;
    log.games.push({ ...game, win });
    if (win) log.wins++;
    else log.losses++;

    if (options.deadline && game.game === CONFIG.sim.deadlineAfterGame) {
      log.events.push({ kind: "deadline", afterGame: CONFIG.sim.deadlineAfterGame });
      if (input.trade === "pending") {
        log.status = "deadline";
        break;
      }
      if (trade && outgoing) {
        log.events.push({
          kind: "trade", afterGame: CONFIG.sim.deadlineAfterGame,
          out: outgoing, in: trade.offer.player,
          injuredGames: trade.offer.injured ? null : 0, filler: null,
        });
      }
    }
  }
  return log;
}

export function tierLabel(wins: number): "Enttäuschung" | "Playoffs" | "Contender" | "Warriors-Rekord geknackt" | "Perfektion" {
  const tiers = CONFIG.sim.tiers;
  if (wins >= tiers.perfection) return "Perfektion";
  if (wins >= tiers.record) return "Warriors-Rekord geknackt";
  if (wins >= tiers.contender) return "Contender";
  if (wins >= tiers.playoffs) return "Playoffs";
  return "Enttäuschung";
}
