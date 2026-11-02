import { describe, expect, it } from "vitest";
import { berlinDate, msUntilNextPuzzle, puzzleNumber } from "../../src/game/daily";

describe("Tagesrätsel", () => {
  it.each([
    ["2026-10-25T23:30:00Z", 1], ["2026-10-25T22:59:00Z", 1],
    ["2026-10-27T10:00:00Z", 2], ["2027-03-28T21:30:00Z", 154],
    ["2027-03-28T22:30:00Z", 155],
  ])("berechnet die Rätselnummer für %s", (date, n) => {
    expect(puzzleNumber(new Date(date))).toBe(n);
  });
  it("liefert ein Kalenderdatum in Berlin", () => {
    expect(berlinDate(new Date("2026-10-31T23:30:00Z"))).toBe("2026-11-01");
  });
  it("berechnet die verbleibende Stunde bis Mitternacht", () => {
    expect(msUntilNextPuzzle(new Date("2026-11-01T22:00:00Z"))).toBe(60 * 60 * 1000);
  });
  it.each([
    ["2027-03-27T23:00:00Z", 23], ["2026-10-24T22:00:00Z", 25],
  ])("berücksichtigt den Zeitwechsel für %s", (date, hours) => {
    expect(msUntilNextPuzzle(new Date(date))).toBe(hours * 60 * 60 * 1000);
  });
});
