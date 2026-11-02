import { CONFIG } from "../config";
import { hash, makeRng, shuffle } from "./rng";
import { assignSlots, canAdd } from "./slots";
import type { Player, Pos, Tier } from "./types";

export interface DraftState {
  picks: Player[];
  round: number;
  offers: Record<Tier, Player[]>;
  /** Pick-Anzahl, bei der die Matrix neu gezogen wurde (einmal pro Run), sonst null. */
  refreshedAt: number | null;
  /** Aufstellung: Spieler-ID je Platz in der Reihenfolge G, G, F, F, C (null = frei). */
  slots: (string | null)[];
}

export const SLOT_POSITIONS: Pos[] = ["G", "G", "F", "F", "C"];

function fits(player: Player, slot: number): boolean {
  return player.positions.includes(SLOT_POSITIONS[slot]);
}

/** Platz für einen neuen Pick: gewünschter Platz, sonst erster freier passender, sonst Neuordnung. */
function placePick(slots: (string | null)[], picks: Player[], player: Player, slotIndex?: number): (string | null)[] {
  if (slotIndex !== undefined) {
    if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= SLOT_POSITIONS.length) throw new Error("Unbekannter Platz.");
    if (slots[slotIndex] !== null) throw new Error("Dieser Platz ist schon belegt.");
    if (!fits(player, slotIndex)) throw new Error("Der Spieler passt nicht auf diesen Platz.");
    return slots.map((id, i) => (i === slotIndex ? player.id : id));
  }
  const free = slots.findIndex((id, i) => id === null && fits(player, i));
  if (free >= 0) return slots.map((id, i) => (i === free ? player.id : id));
  // Neu ordnen: jeder bleibt möglichst auf seinem Platz, nur wer muss, rückt um.
  const assignment = assignSlots([...picks, player]);
  if (!assignment) throw new Error("Für diesen Spieler ist kein Platz frei.");
  const next: (string | null)[] = SLOT_POSITIONS.map(() => null);
  const all = [...picks, player];
  for (const p of all) {
    const keep = slots.indexOf(p.id);
    if (keep >= 0 && SLOT_POSITIONS[keep] === assignment[p.id] && next[keep] === null) next[keep] = p.id;
  }
  for (const p of all) {
    if (next.includes(p.id)) continue;
    const index = SLOT_POSITIONS.findIndex((pos, i) => pos === assignment[p.id] && next[i] === null);
    next[index] = p.id;
  }
  return next;
}

/** Gewählten Spieler auf einen anderen Platz schieben; ist der belegt, tauschen beide (wenn beide passen). */
export function moveSlot(state: DraftState, from: number, to: number): DraftState {
  const byId = (id: string | null) => (id === null ? null : state.picks.find((p) => p.id === id) ?? null);
  const moving = byId(state.slots[from] ?? null);
  if (!moving) throw new Error("Auf diesem Platz steht niemand.");
  if (from === to) return state;
  const other = byId(state.slots[to] ?? null);
  if (!fits(moving, to) || (other && !fits(other, from))) throw new Error("Der Spieler passt nicht auf diesen Platz.");
  const slots = [...state.slots];
  slots[to] = moving.id;
  slots[from] = other ? other.id : null;
  return { ...state, slots };
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

  return withRescue(offers, picks, pool, budget);
}

/** Notregel: Ist keine Kachel wählbar, ersetzt der billigste passende Spieler eine gesperrte Kachel in Tier 5. */
function withRescue(offers: Record<Tier, Player[]>, picks: Player[], pool: Player[], budget: number): Record<Tier, Player[]> {
  if (picks.length >= CONFIG.playersPerTeam) return offers;
  if (tiers.some((tier) => offers[tier].some((p) => isAffordable(p, picks, pool, budget)))) return offers;
  const shown = new Set(tiers.flatMap((tier) => offers[tier].map((p) => p.id)));
  const cheapest = [...pool].sort((a, b) => a.price - b.price)
    .find((p) => !shown.has(p.id) && isAffordable(p, picks, pool, budget));
  if (!cheapest) return offers;
  const row = [...offers[5]];
  // Der Rettungsplatz liegt immer in Tier 5, auch wenn der Spieler aus einem anderen Tier stammt.
  row.splice(Math.max(0, row.length - 1), row.length >= CONFIG.draft.offersPerTier ? 1 : 0, cheapest);
  return { ...offers, 5: row };
}

export function startDraft(pool: Player[], seed: string, budget: number): DraftState {
  return { picks: [], round: 1, offers: drawOffers(pool, [], seed, budget), refreshedAt: null,
    slots: SLOT_POSITIONS.map(() => null) };
}

export function pickPlayer(state: DraftState, p: Player, pool: Player[], _seed: string, budget: number, slotIndex?: number): DraftState {
  if (state.picks.length >= CONFIG.playersPerTeam) throw new Error("Der Draft ist bereits vollständig.");
  // Der Pool ist maßgeblich; vom Aufrufer veränderte Kartenpreise werden nicht übernommen.
  const player = pool.find((candidate) => candidate.id === p.id);
  if (!player || !tiers.some((tier) => state.offers[tier].some((card) => card.id === player.id))) {
    throw new Error("Dieser Spieler wird gerade nicht angeboten.");
  }
  if (!isAffordable(player, state.picks, pool, budget)) throw new Error("Dieser Spieler passt nicht ins verbleibende Budget oder in die Aufstellung.");
  const slots = placePick(state.slots, state.picks, player, slotIndex);
  const picks = [...state.picks, player];
  return {
    slots,
    picks,
    round: Math.min(picks.length + 1, CONFIG.playersPerTeam),
    // Die Matrix bleibt stehen: nur der gewählte Spieler verschwindet.
    offers: withRescue(removeFromOffers(state.offers, player.id), picks, pool, budget),
    refreshedAt: state.refreshedAt,
  };
}

function removeFromOffers(offers: Record<Tier, Player[]>, id: string): Record<Tier, Player[]> {
  return Object.fromEntries(tiers.map((tier) => [tier, offers[tier].filter((p) => p.id !== id)])) as Record<Tier, Player[]>;
}

/** Einmal pro Run: die komplette Matrix für die noch freien Plätze neu ziehen. */
export function refreshOffers(state: DraftState, pool: Player[], seed: string, budget: number): DraftState {
  if (state.refreshedAt !== null) throw new Error("Neu ziehen geht nur einmal pro Run.");
  if (state.picks.length >= CONFIG.playersPerTeam) throw new Error("Der Draft ist bereits vollständig.");
  return { ...state, offers: drawOffers(pool, state.picks, seed + "|neu", budget), refreshedAt: state.picks.length };
}
