import { CONFIG } from "../config";
import { hash, makeRng, randInt } from "./rng";
import { canAdd } from "./slots";
import type { Player } from "./types";

export const BANKRUPTCY_REASONS: string[] = [
  "das komplette Teamvermögen in die Kryptowährung „DunkCoin“ gesteckt. Sie ist am selben Abend auf 0 gefallen.",
  "in Phoenix eine Arena aus Eis bauen lassen.",
  "für ein Heimspiel auf dem Mond schon die Rakete angezahlt.",
  "Wackelkopf-Figuren des Maskottchens bestellt und sich dabei um sechs Nullen vertippt.",
  "beim Pokern gegen das eigene Maskottchen alles verloren, inklusive Jacht.",
  "das Passwort fürs Firmenkonto auf T-Shirts drucken lassen und sie mit der T-Shirt-Kanone in die Menge geschossen.",
  "einen Rechtsstreit gegen eine Taube verloren, die unter dem Hallendach wohnt.",
  "„All you can eat – für immer“-Hotdogs verkauft. Ein Fan hat es wörtlich genommen.",
  "jedem Zuschauer ein Auto geschenkt, bei ausverkaufter Halle.",
  "in einen Sneaker investiert, den es nur für den linken Fuß gibt.",
  "eine Privatinsel gekauft, um Freiwürfe ohne Wind zu trainieren. Die Insel war ein Wal.",
  "beim Spendentag „Fairplay“ sein ganzes Vermögen ans gegnerische Team überwiesen.",
  "die Filmrechte an einem Basketballfilm gekauft, in dem nur ein Goldfisch mitspielt.",
  "jeden Abend das Teamlogo als Hologramm auf die Wolken über der Stadt projizieren lassen.",
  "dagegen gewettet, dass sein Team 82-0 geht, und schaut gerade sehr nervös auf die Bilanz.",
];

export function bankruptcyPlan(seedKey: string): { happens: boolean; atWins: number; reasonIndex: number } {
  const rng = makeRng(hash(`${seedKey}|bankrupt`));
  return {
    happens: rng() < CONFIG.bankruptcy.chance,
    atWins: randInt(rng, CONFIG.bankruptcy.minWins, CONFIG.bankruptcy.maxWins),
    reasonIndex: randInt(rng, 0, BANKRUPTCY_REASONS.length - 1),
  };
}

export function bankruptcyVictim(roster: Player[], pool: Player[], luxuryLine: number, seedKey: string): { out: Player; in: Player } | null {
  const salary = roster.reduce((sum, player) => sum + player.price, 0);
  const excluded = new Set(roster.map((player) => player.id));
  // Feste Reihenfolgen halten die Auswahl auch bei umsortiertem Kader und Preisgleichheit stabil.
  const byId = (a: Player, b: Player) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  const replacements = pool.filter((player) => player.tier === 5 && !excluded.has(player.id))
    .sort((a, b) => a.price - b.price || byId(a, b));
  const candidates: { out: Player; in: Player }[] = [];
  for (const out of [...roster].sort(byId)) {
    const remaining = roster.filter((player) => player.id !== out.id);
    const replacement = replacements.find((player) => canAdd(remaining, player));
    if (replacement && salary - out.price + replacement.price <= luxuryLine) {
      candidates.push({ out, in: replacement });
    }
  }
  if (candidates.length === 0) return null;

  let draw = makeRng(hash(seedKey))() * candidates.reduce((sum, candidate) => sum + candidate.out.price, 0);
  for (const candidate of candidates) {
    draw -= candidate.out.price;
    if (draw < 0) return candidate;
  }
  return candidates[candidates.length - 1];
}
