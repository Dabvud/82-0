import type { NbaTeam, Player, Pos, Tier } from "../../src/game/types";

export const FIXTURE_BUDGET = 1.4 * 164_961_000;

export const FIXTURE_TEAMS: NbaTeam[] = Array.from({ length: 30 }, (_, index) => ({
  abbr: `T${String(index + 1).padStart(2, "0")}`,
  name: `Gegner ${index + 1}`,
  net: -10 + 20 * index / 29,
}));

export function makePlayer(partial: Partial<Player> = {}): Player {
  return {
    id: "fixture-player",
    name: "Testspieler",
    positions: ["G"],
    peak: { from: 2001, to: 2003 },
    cats: { shooter: 60, finisher: 60, playmaking: 60, rebound: 60, defense: 60, oreb: 60, dreb: 60, blk: 60 },
    strength: 60,
    tier: 3,
    price: 20_000_000,
    priceSource: "contract",
    contract: { season: 2026, team: "TEST" },
    value: 0,
    overpaid: false,
    estimated: false,
    ...partial,
  };
}

const priceRanges: Record<Tier, [number, number]> = {
  1: [0.25, 0.35], 2: [0.15, 0.30], 3: [0.08, 0.18], 4: [0.03, 0.10], 5: [0.01, 0.04],
};

export const FIXTURE_POOL: Player[] = ([1, 2, 3, 4, 5] as const).flatMap((tier) =>
  Array.from({ length: 12 }, (_, index) => {
    const positions: Pos[] = index < 5 ? ["G"] : index < 9 ? ["F"] : index < 11 ? ["C"]
      : tier % 2 === 0 ? ["F", "C"] : ["G", "F"];
    const [min, max] = priceRanges[tier];
    // Durchmischte Preise verhindern, dass Position und Preis ständig zusammenfallen.
    const pct = min + (max - min) * ((index * 7) % 12) / 11;
    // Die Rundung auf 10 000 Dollar darf keine Tier-Grenze überschreiten.
    const minPrice = Math.ceil(164_961_000 * min / 10_000) * 10_000;
    const maxPrice = Math.floor(164_961_000 * max / 10_000) * 10_000;
    const price = Math.max(minPrice, Math.min(maxPrice, Math.round(164_961_000 * pct / 10_000) * 10_000));
    const rating = 100 - tier * 15 + index;
    return makePlayer({
      id: `fixture-t${tier}-${index}`,
      name: `Spieler ${tier}-${index}`,
      positions,
      tier,
      price,
      strength: rating,
      cats: { shooter: rating, finisher: rating, playmaking: rating, rebound: rating, defense: rating, oreb: rating, dreb: rating, blk: rating },
      overpaid: index === 7 || index === 10,
      value: index === 7 || index === 10 ? -10 : 2,
    });
  }),
);
