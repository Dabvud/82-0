import { CONFIG } from "../config";
import type { Player, Pos } from "./types";

const positions: Pos[] = ["G", "F", "C"];

function visitAssignments(
  players: Player[],
  visit: (assignment: Record<string, Pos>, remaining: Record<Pos, number>) => boolean,
): boolean {
  if (players.length > CONFIG.playersPerTeam || new Set(players.map((p) => p.id)).size !== players.length) return false;
  const remaining: Record<Pos, number> = { ...CONFIG.draft.slots };
  const assignment: Record<string, Pos> = {};

  function search(index: number): boolean {
    if (index === players.length) return visit(assignment, remaining);
    const player = players[index];
    for (const pos of player.positions) {
      if (remaining[pos] <= 0) continue;
      remaining[pos]--;
      // defineProperty unterstützt auch IDs wie „__proto__“ als normale Schlüssel.
      Object.defineProperty(assignment, player.id, { value: pos, enumerable: true, configurable: true });
      if (search(index + 1)) return true;
      remaining[pos]++;
      delete assignment[player.id];
    }
    return false;
  }

  return search(0);
}

export function assignSlots(players: Player[]): Record<string, Pos> | null {
  let result: Record<string, Pos> | null = null;
  visitAssignments(players, (assignment) => {
    result = { ...assignment };
    return true;
  });
  return result;
}

export function openNeeds(players: Player[]): Pos[] {
  const needs = new Set<Pos>();
  // Die Vereinigung aller Zuordnungen bewahrt die Flexibilität von Doppelpositionen.
  visitAssignments(players, (_assignment, remaining) => {
    for (const pos of positions) if (remaining[pos] > 0) needs.add(pos);
    return needs.size === positions.length;
  });
  return positions.filter((pos) => needs.has(pos));
}

export function canAdd(players: Player[], p: Player): boolean {
  return assignSlots([...players, p]) !== null;
}
