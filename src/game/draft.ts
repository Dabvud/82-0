import { CONFIG } from "../config";
import { hash, makeRng, shuffle } from "./rng";
import { assignSlots, canAdd } from "./slots";
import type { Player, Pos, Tier } from "./types";

export interface DraftState {
  picks: Player[];
  round: number;
  offers: Record<Tier, Player[]>;
}

const tiers: Tier[] = [1, 2, 3, 4, 5];
const positions: Pos[] = ["G", "F", "C"];
const capacities = CONFIG.draft.slots;
// Gemischte Stellenwerte codieren die Belegung von G, F und C in einem Arrayindex.
const strides: Record<Pos, number> = { G: 1, F: capacities.G + 1, C: (capacities.G + 1) * (capacities.F + 1) };
const stateCount = strides.C * (capacities.C + 1);
const occupancy = Array.from({ length: stateCount }, (_, state) =>
  positions.filter((pos) => Math.floor(state / strides[pos]) % (capacities[pos] + 1) < capacities[pos]),
);

function emptyOffers(): Record<Tier, Player[]> {
  return { 1: [], 2: [], 3: [], 4: [], 5: [] };
}

export function minCostToComplete(picks: Player[], pool: Player[]): number {
  if (assignSlots(picks) === null) return Infinity;
  if (picks.length === CONFIG.playersPerTeam) return 0;
  const picked = new Set(picks.map((p) => p.id));
  const available = pool.filter((p) => !picked.has(p.id)).sort((a, b) => a.price - b.price);
  const counts: Record<Pos, number> = { G: 0, F: 0, C: 0 };
  const seen = new Set<string>();
  const candidates = available.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    let keep = false;
    for (const pos of p.positions) {
      if (counts[pos] < CONFIG.draft.completionCandidatesPerPosition) {
        counts[pos]++;
        keep = true;
      }
    }
    return keep;
  });

  let costs = new Array<number>(stateCount).fill(Infinity);
  costs[0] = 0;
  // Gewählte Spieler sind verpflichtend und verursachen hier keine weiteren Kosten.
  for (const p of picks) {
    const next = new Array<number>(stateCount).fill(Infinity);
    for (let state = 0; state < stateCount; state++) {
      if (!Number.isFinite(costs[state])) continue;
      for (const pos of p.positions) {
        if (occupancy[state].includes(pos)) next[state + strides[pos]] = Math.min(next[state + strides[pos]], costs[state]);
      }
    }
    costs = next;
  }

  // Rückwärts durchlaufen: Auch ein Spieler mit mehreren Positionen zählt nur einmal.
  for (const p of candidates) {
    for (let state = stateCount - 1; state >= 0; state--) {
      if (!Number.isFinite(costs[state])) continue;
      for (const pos of p.positions) {
        if (occupancy[state].includes(pos)) {
          const next = state + strides[pos];
          costs[next] = Math.min(costs[next], costs[state] + p.price);
        }
      }
    }
  }
  return costs[stateCount - 1];
}

export function isAffordable(p: Player, picks: Player[], pool: Player[], budget: number): boolean {
  if (!canAdd(picks, p)) return false;
  const remaining = budget - picks.reduce((sum, chosen) => sum + chosen.price, 0) - p.price;
  return remaining >= 0 && minCostToComplete([...picks, p], pool) <= remaining;
}

export function drawOffers(pool: Player[], picks: Player[], seed: string, budget: number): Record<Tier, Player[]> {
  const offers = emptyOffers();
  if (picks.length >= CONFIG.playersPerTeam) return offers;
  const round = picks.length + 1;
  const eligible = pool.filter((p) => canAdd(picks, p));
  for (const tier of tiers) {
    const shuffled = shuffle(makeRng(hash(`${seed}|r${round}|t${tier}`)), eligible.filter((p) => p.tier === tier));
    const targets: Record<Pos, number> = { ...capacities };
    const selected = new Set<string>();
    for (const p of shuffled) {
      if (offers[tier].length >= CONFIG.draft.offersPerTier) break;
      const pos = p.positions.find((position) => targets[position] > 0);
      if (!pos || selected.has(p.id)) continue;
      offers[tier].push(p);
      selected.add(p.id);
      targets[pos]--;
    }
    for (const p of shuffled) {
      if (offers[tier].length >= CONFIG.draft.offersPerTier) break;
      if (!selected.has(p.id)) {
        offers[tier].push(p);
        selected.add(p.id);
      }
    }
  }

  if (!tiers.some((tier) => offers[tier].some((p) => isAffordable(p, picks, pool, budget)))) {
    const cheapest = [...eligible].sort((a, b) => a.price - b.price).find((p) => isAffordable(p, picks, pool, budget));
    if (cheapest) {
      // Der Rettungsplatz liegt immer in Tier 5, auch wenn der Spieler aus einem anderen Tier stammt.
      offers[5].splice(Math.max(0, offers[5].length - 1), 1, cheapest);
    }
  }
  return offers;
}

export function startDraft(pool: Player[], seed: string, budget: number): DraftState {
  return { picks: [], round: 1, offers: drawOffers(pool, [], seed, budget) };
}

export function pickPlayer(state: DraftState, p: Player, pool: Player[], seed: string, budget: number): DraftState {
  if (state.picks.length >= CONFIG.playersPerTeam) throw new Error("Der Draft ist bereits vollständig.");
  // Der Pool ist maßgeblich; vom Aufrufer veränderte Kartenpreise werden nicht übernommen.
  const player = pool.find((candidate) => candidate.id === p.id);
  if (!player || !tiers.some((tier) => state.offers[tier].some((card) => card.id === player.id))) {
    throw new Error("Dieser Spieler wird gerade nicht angeboten.");
  }
  if (!isAffordable(player, state.picks, pool, budget)) throw new Error("Dieser Spieler passt nicht ins verbleibende Budget oder in die Aufstellung.");
  const picks = [...state.picks, player];
  return {
    picks,
    round: Math.min(picks.length + 1, CONFIG.playersPerTeam),
    offers: drawOffers(pool, picks, seed, budget),
  };
}
