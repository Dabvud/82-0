import { describe, expect, it } from "vitest";
import { isOverpaid, pricePct, valueResiduals } from "../../src/model/price";

describe("Preis und Preis-Leistung", () => {
  it("deckelt einen Vertragsanteil von 0,42 bei 0,35", () => {
    expect(pricePct(0.42, 1)).toEqual({ pct: 0.35, source: "contract" });
  });

  it("verwendet ohne Vertrag für Tier 3 einen Anteil von 0,14", () => {
    expect(pricePct(null, 3)).toEqual({ pct: 0.14, source: "tier" });
  });

  it("liefert auf einer perfekten Geraden nur Residuen von 0", () => {
    const residuals = valueResiduals([20, 40, 60, 80], [0.05, 0.1, 0.15, 0.2]);
    expect(residuals).toHaveLength(4);
    residuals.forEach((residual) => expect(residual).toBeCloseTo(0));
  });

  it("erkennt einen Ausreißer nach unten und Überbezahlung bei −9", () => {
    const residuals = valueResiduals([20, 40, 30, 80], [0.05, 0.1, 0.15, 0.2]);
    expect(residuals[2]).toBeLessThan(0);
    expect(isOverpaid(-9)).toBe(true);
  });
});
