// Kalibrierung: simuliert viele Drafts mit den echten Daten und zeigt, wie sich die Bilanzen verteilen.
// Aufruf: npm run calibrate [-- Anzahl]
import { BUDGET, LUXURY_LINE, PLAYERS, TEAMS } from "../src/data";
import { isAffordable, pickPlayer, startDraft } from "../src/game/draft";
import type { DraftState } from "../src/game/draft";
import { hash, makeRng, pick } from "../src/game/rng";
import { playSeason } from "../src/game/season";
import { teamRating } from "../src/game/team";
import type { Player } from "../src/game/types";

type Strategy = "zufällig" | "gierig";

function cards(state: DraftState): Player[] {
  return Object.values(state.offers).flat().filter((p) => isAffordable(p, state.picks, PLAYERS, BUDGET));
}

/** Gierig: die Karte mit dem besten Teamwert nach dem Pick (ab Pick 1 über die Rohstärke). */
function choose(state: DraftState, strategy: Strategy, rng: () => number): Player {
  const options = cards(state);
  if (strategy === "zufällig") return pick(rng, options);
  return options.reduce((best, p) => {
    const score = (q: Player) => state.picks.length < 2 ? q.strength : teamRating([...state.picks, q]).net + q.strength / 20;
    return score(p) > score(best) ? p : best;
  });
}

export function runDrafts(count: number, strategy: Strategy): number[] {
  const wins: number[] = [];
  for (let i = 0; i < count; i++) {
    const seed = `kal-${strategy}-${i}`;
    const rng = makeRng(hash(seed));
    let state = startDraft(PLAYERS, seed, BUDGET);
    while (state.picks.length < 5) state = pickPlayer(state, choose(state, strategy, rng), PLAYERS, seed, BUDGET);
    const log = playSeason({ lineup: state.picks, seedKey: seed, options: { deadline: false, bankruptcy: false },
      pool: PLAYERS, luxuryLine: LUXURY_LINE }, TEAMS);
    wins.push(log.wins);
  }
  return wins.sort((a, b) => a - b);
}

function summary(label: string, wins: number[]): string {
  const q = (p: number) => wins[Math.min(wins.length - 1, Math.floor(wins.length * p))];
  const share = (min: number) => `${(wins.filter((w) => w >= min).length / wins.length * 100).toFixed(1)} %`;
  return `${label}: P10 ${q(0.1)}, Median ${q(0.5)}, P90 ${q(0.9)}, max ${wins.at(-1)} | ≥60 ${share(60)}, ≥70 ${share(70)}, ≥74 ${share(74)}, 82-0 ${share(82)}`;
}

if (!process.env.VITEST) {
  const count = Number(process.argv.find((a) => /^\d+$/.test(a)) ?? 2000);
  console.log(summary("Zufällig", runDrafts(count, "zufällig")));
  console.log(summary("Gierig  ", runDrafts(Math.max(200, count / 5), "gierig")));
}
