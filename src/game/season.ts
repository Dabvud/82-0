import { CONFIG } from "../config";
import { BANKRUPTCY_REASONS, bankruptcyPlan, bankruptcyVictim } from "./bankruptcy";
import { hash, makeRng } from "./rng";
import { buildSchedule } from "./schedule";
import { teamRating } from "./team";
import { injuryGames, pickFiller } from "./trade";
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
  luxuryLine: number;
}

export type SeasonEvent =
  | { kind: "deadline"; afterGame: 50 }
  | { kind: "trade"; afterGame: 50; out: Player; in: Player; injuredGames: number; filler: Player | null }
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
  let tradedLineup = trade ? lineup.map((p) => p.id === trade.outId ? trade.offer.player : p) : lineup;
  const injuredGames = trade?.offer.injured ? injuryGames(seedKey, trade.outId, trade.offer.player.id) : 0;
  const filler = injuredGames > 0 && outgoing ? pickFiller(lineup, outgoing, input.pool, seedKey) : null;
  let fillerLineup = filler && trade ? lineup.map((p) => p.id === trade.outId ? filler : p) : lineup;
  const returnAfterGame = CONFIG.sim.deadlineAfterGame + injuredGames;
  const plan = bankruptcyPlan(seedKey);
  let injuredPlayerRemoved = false;

  function rosterForGame(game: number): Player[] {
    if (game <= CONFIG.sim.deadlineAfterGame) return lineup;
    return game <= returnAfterGame ? fillerLineup : tradedLineup;
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
          injuredGames, filler,
        });
      }
    }
    if (win && options.bankruptcy && plan.happens && log.wins === plan.atWins) {
      // Der verletzte Neuzugang wird bezahlt, sein Lückenfüller nicht.
      const salaryRoster = filler && trade && !injuredPlayerRemoved && game.game > CONFIG.sim.deadlineAfterGame && game.game <= returnAfterGame
        ? roster.map((player) => player.id === filler.id ? trade.offer.player : player)
        : roster;
      const salary = salaryRoster.reduce((sum, player) => sum + player.price, 0);
      if (salary > input.luxuryLine) {
        const victim = bankruptcyVictim(salaryRoster, input.pool, input.luxuryLine, `${seedKey}|victim|${game.game}`);
        if (victim) {
          const removesInjured = trade?.offer.player.id === victim.out.id && injuredGames > 0;
          const replace = (players: Player[]) => players.map((player) =>
            player.id === victim.out.id || (removesInjured && player.id === filler?.id) ? victim.in : player,
          );
          // Beide Kader ändern, damit eine spätere Rückkehr den Ersatz nicht überschreibt.
          tradedLineup = replace(tradedLineup);
          fillerLineup = replace(fillerLineup);
          injuredPlayerRemoved = removesInjured;
          log.events.push({
            kind: "bankrupt", afterGame: game.game, ...victim,
            reason: `Der Owner ist pleite! Er hat ${BANKRUPTCY_REASONS[plan.reasonIndex]} ${victim.out.name} muss das Team verlassen, ${victim.in.name} übernimmt.`,
          });
        }
      }
    }
    if (trade && injuredGames > 0 && !injuredPlayerRemoved && game.game === returnAfterGame && returnAfterGame < CONFIG.sim.seasonGames) {
      log.events.push({ kind: "injury-return", afterGame: returnAfterGame, player: trade.offer.player });
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
