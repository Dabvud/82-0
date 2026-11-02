import { CONFIG } from "../config";

export function pricePct(maxCapShare: number | null, tier: 1 | 2 | 3 | 4 | 5): {
  pct: number; source: "contract" | "tier";
} {
  return maxCapShare === null
    ? { pct: CONFIG.tierPricePct[tier], source: "tier" }
    : { pct: Math.min(CONFIG.priceCapPct, maxCapShare), source: "contract" };
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
