import { CONFIG } from "../config";

export function pricePct(maxCapShare: number | null, tier: 1 | 2 | 3 | 4 | 5, cap: number = CONFIG.priceCapPct): {
  pct: number; source: "contract" | "tier";
} {
  return maxCapShare === null
    ? { pct: CONFIG.tierPricePct[tier], source: "tier" }
    : { pct: Math.min(cap, maxCapShare), source: "contract" };
}

// Umzüge und Umbenennungen zählen als dieselbe Franchise (Basketball-Reference-Kürzel).
const FRANCHISE: Record<string, string> = {
  SEA: "OKC", NJN: "BRK", NJA: "BRK", NYA: "BRK", VAN: "MEM", CHH: "CHO", CHA: "CHO", NOH: "NOP", NOK: "NOP",
  WSB: "WAS", CAP: "WAS", BAL: "WAS", CHZ: "WAS", CHP: "WAS", KCK: "SAC", KCO: "SAC", CIN: "SAC", ROC: "SAC",
  SDC: "LAC", BUF: "LAC", PHW: "GSW", SFW: "GSW", MNL: "LAL", STL: "ATL", MLH: "ATL", TRI: "ATL", SYR: "PHI",
  FTW: "DET", NOJ: "UTA", SDR: "HOU",
};
const franchise = (abbr: string) => FRANCHISE[abbr] ?? abbr;

/** Saisons am Stück bei derselben Franchise bis zur Vertragssaison (bzw. der letzten gespielten davor). */
export function franchiseStreak(teamBySeason: Map<number, string>, contractSeason: number): number {
  const seasons = [...teamBySeason.keys()].filter((s) => s <= contractSeason).sort((a, b) => b - a);
  if (seasons.length === 0) return 0;
  const team = franchise(teamBySeason.get(seasons[0])!);
  let streak = 0;
  for (let i = 0; i < seasons.length; i++) {
    if (franchise(teamBySeason.get(seasons[i])!) !== team) break;
    if (i > 0 && seasons[i - 1] - seasons[i] > 1) break;
    streak++;
  }
  return streak;
}

/** Supermax (35 %) nur nach langer Zeit beim Vertragsteam, sonst Max (30 %). */
export function capForTenure(streak: number): number {
  return streak >= CONFIG.supermaxTenure ? CONFIG.priceCapPct : CONFIG.priceCapShortTenure;
}

/** All-Timer ohne Vertragsdaten: linear von 30 % (schwächster) bis 35 % (stärkster) nach Stärke. */
export function allTimerPcts(strengths: number[]): number[] {
  const { min, max } = CONFIG.allTimerPct;
  const lo = Math.min(...strengths);
  const hi = Math.max(...strengths);
  return strengths.map((s) => (hi === lo ? max : min + (max - min) * (s - lo) / (hi - lo)));
}

export function valueResiduals(strengths: number[], pcts: number[]): number[] {
  if (strengths.length !== pcts.length) {
    throw new Error("Für die Regression werden gleich viele Stärken und Preise benötigt.");
  }
  if (strengths.length === 0) return [];
  const meanStrength = strengths.reduce((sum, value) => sum + value, 0) / strengths.length;
  const meanPrice = pcts.reduce((sum, value) => sum + value, 0) / pcts.length;
  const variance = pcts.reduce((sum, value) => sum + (value - meanPrice) ** 2, 0);
  const covariance = pcts.reduce((sum, value, index) =>
    sum + (value - meanPrice) * (strengths[index] - meanStrength), 0);
  // Bei gleichen Preisen ist die Vorhersage die mittlere Stärke des Pools.
  const slope = variance === 0 ? 0 : covariance / variance;
  return strengths.map((value, index) => value - (meanStrength + slope * (pcts[index] - meanPrice)));
}

export function isOverpaid(residual: number): boolean {
  return residual < -CONFIG.overpaidMargin;
}
