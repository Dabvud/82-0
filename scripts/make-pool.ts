import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import type { Pos } from "../src/model/types";

export interface PoolPlayer {
  id: string;
  name: string;
  bbrefId: string;
  positions: Pos[];
}
export interface PoolProposal {
  kandidaten: (PoolPlayer & { selected: boolean })[];
  ergaenzungen: (PoolPlayer & { selected: boolean })[];
}
interface PoolChanges { ab?: string[]; hinzu?: string[] }

export function parsePoolChanges(args: string[]): PoolChanges {
  const changes = { ab: [] as string[], hinzu: [] as string[] };
  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];
    if ((flag !== "--ab" && flag !== "--hinzu") || !value || value.startsWith("--")) {
      throw new Error("Aufruf: make-pool.ts [--ab id1,id2] [--hinzu id3,id4]");
    }
    const ids = value.split(",").map(id => id.trim());
    if (ids.some(id => !id)) throw new Error(`Leere ID bei ${flag}.`);
    changes[flag === "--ab" ? "ab" : "hinzu"].push(...ids);
  }
  return changes;
}

export function makePool(proposal: PoolProposal, { ab = [], hinzu = [] }: PoolChanges = {}): PoolPlayer[] {
  const all = [...proposal.kandidaten, ...proposal.ergaenzungen];
  const available = new Map(all.map(player => [player.id, player]));
  if (available.size !== all.length) throw new Error("Doppelte IDs im Vorschlag.");
  for (const id of [...ab, ...hinzu]) {
    if (!available.has(id)) throw new Error(`Unbekannte ID: ${id}`);
    if (ab.includes(id) && hinzu.includes(id)) throw new Error(`ID gleichzeitig abgewählt und hinzugefügt: ${id}`);
  }
  const selected = new Set(proposal.kandidaten.filter(player => player.selected).map(player => player.id));
  ab.forEach(id => selected.delete(id));
  hinzu.forEach(id => selected.add(id));
  const pool = [...selected].map(id => {
    const { name, bbrefId, positions } = available.get(id)!;
    if (!bbrefId || !positions.length || positions.some(pos => !["G", "F", "C"].includes(pos))) {
      throw new Error(`Ungültige Position oder bbrefId für ${id}.`);
    }
    return { id, name, bbrefId, positions: [...new Set(positions)] };
  });
  if (new Set(pool.map(player => player.bbrefId)).size !== pool.length) {
    throw new Error("Doppelte bbrefId im ausgewählten Pool.");
  }
  return pool;
}

export function main(args = process.argv.slice(2)) {
  const proposal: PoolProposal = JSON.parse(readFileSync(".superpowers/pool-vorschlag.json", "utf8"));
  const pool = makePool(proposal, parsePoolChanges(args));
  mkdirSync("data/manual", { recursive: true });
  writeFileSync("data/manual/pool.json", `${JSON.stringify(pool, null, 2)}\n`, "utf8");
  console.log(`Vorläufiger Pool: ${pool.length}; ${(["G", "F", "C"] as const)
    .map(pos => `${pos}: ${pool.filter(player => player.positions.includes(pos)).length}`).join("; ")}`);
}

// Nur ausführen, wenn dieses Skript direkt gestartet wurde (nicht beim Import, nicht unter Vitest).
if (!process.env.VITEST && process.argv.some((arg) => arg.replace(/\\/g, "/").endsWith("make-pool.ts"))) main();