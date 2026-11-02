import { CONFIG } from "../config";
import { hash, makeRng, pick, randInt } from "./rng";
import { canAdd } from "./slots";
import type { Player, TradeOffer } from "./types";

function replacements(lineup: Player[], out: Player, pool: Player[]): Player[] {
  const remaining = lineup.filter((player) => player.id !== out.id);
  const excluded = new Set(lineup.map((player) => player.id));
  return pool.filter((player) => {
    if (excluded.has(player.id)) return false;
    excluded.add(player.id);
    return canAdd(remaining, player);
  });
}

export function tradeOffers(lineup: Player[], out: Player, pool: Player[], budget: number, seedKey: string): TradeOffer[] {
  const config = CONFIG.trade;
  const availableBudget = budget - lineup.reduce((sum, player) => sum + player.price, 0) + out.price;
  const eligible = replacements(lineup, out, pool).filter((player) =>
    player.price <= availableBudget && (out.overpaid || Math.abs(player.value - out.value) <= config.valueWindow),
  );
  let window: number = config.salaryWindow;
  let candidates = eligible.filter((player) => Math.abs(player.price - out.price) <= out.price * window);
  let step = 0;
  while (candidates.length < config.offers && window < config.salaryMaxWindow) {
    window = Math.min(config.salaryMaxWindow, config.salaryWindow + ++step * config.salaryWidenStep);
    candidates = eligible.filter((player) => Math.abs(player.price - out.price) <= out.price * window);
  }

  const rng = makeRng(hash(`${seedKey}|trade|${out.id}`));
  const offers: TradeOffer[] = [];
  while (offers.length < config.offers && candidates.length > 0) {
    let choices = candidates;
    if (out.overpaid) {
      // Jeder Vorschlag erhält eine eigene Auslosung, auch nach einem Rückfall.
      const wantOverpaid = rng() < 1 - config.injuredChance;
      const preferred = candidates.filter((player) => player.overpaid === wantOverpaid);
      if (preferred.length > 0) choices = preferred;
    }
    const player = pick(rng, choices);
    offers.push({ player, injured: out.overpaid && !player.overpaid });
    candidates = candidates.filter((candidate) => candidate.id !== player.id);
  }
  return offers;
}

export function injuryGames(seedKey: string, outId: string, inId: string): number {
  const rng = makeRng(hash(`${seedKey}|injury|${outId}|${inId}`));
  return randInt(rng, CONFIG.trade.injuryMin, CONFIG.trade.injuryMax);
}

export function pickFiller(lineup: Player[], out: Player, pool: Player[], seedKey: string): Player {
  const fitting = replacements(lineup, out, pool);
  const tier5 = fitting.filter((player) => player.tier === 5);
  // Ohne passenden Tier-5-Spieler einspringen lassen, wer am schwächsten ist – nie abbrechen.
  const candidates = tier5.length > 0 ? tier5 : fitting;
  if (candidates.length === 0) throw new Error("Kein passender Lückenfüller im Pool vorhanden.");
  const weaker = candidates.filter((player) => player.strength < out.strength);
  if (weaker.length > 0) return pick(makeRng(hash(`${seedKey}|filler|${out.id}`)), weaker);
  return candidates.reduce((weakest, player) => player.strength < weakest.strength ? player : weakest);
}
