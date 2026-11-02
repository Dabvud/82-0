import { describe, expect, it } from "vitest";
import { assignSlots, canAdd, openNeeds } from "../../src/game/slots";
import type { Player, Pos } from "../../src/game/types";
import { makePlayer } from "../helpers/fixtures";

function players(...positions: Pos[][]): Player[] {
  return positions.map((pos, index) => makePlayer({ id: `p${index}`, positions: pos }));
}

describe("Positionsplätze", () => {
  it("verteilt eine vollständige Starting Five auf genau 2 G, 2 F, 1 C", () => {
    expect(assignSlots(players(["G"], ["G"], ["F"], ["F"], ["C"])))
      .toEqual({ p0: "G", p1: "G", p2: "F", p3: "F", p4: "C" });
  });

  it("weist einen dritten reinen Guard und einen sechsten Spieler ab", () => {
    expect(assignSlots(players(["G"], ["G"], ["G"])) ).toBeNull();
    expect(assignSlots(players(["G"], ["G"], ["F"], ["F"], ["C"], ["F", "C"]))).toBeNull();
  });

  it("verteilt Doppelpositionen durch Backtracking neu", () => {
    expect(assignSlots(players(["G", "F"], ["G"], ["G"])))
      .toEqual({ p0: "F", p1: "G", p2: "G" });
    expect(assignSlots(players(["C"], ["F", "C"]))).toEqual({ p0: "C", p1: "F" });
  });

  it("unterstützt leere Kader und verhindert doppelte Spieler-IDs", () => {
    expect(assignSlots([])).toEqual({});
    const p = makePlayer();
    expect(assignSlots([p, { ...p }])).toBeNull();
    expect(canAdd([p], { ...p })).toBe(false);
  });

  it("ermittelt offene Positionen über alle gültigen Zuordnungen", () => {
    expect(openNeeds(players(["G"], ["G"], ["F"]))).toEqual(["F", "C"]);
    expect(openNeeds(players(["G", "F"], ["G"], ["F"], ["C"]))).toEqual(["G", "F"]);
    expect(openNeeds(players(["G"], ["G"], ["F"], ["F"], ["C"]))).toEqual([]);
    expect(openNeeds(players(["G"], ["G"], ["G"]))).toEqual([]);
    expect(openNeeds([])).toEqual(["G", "F", "C"]);
  });

  it("erlaubt nur Spieler, die noch einen Platz füllen können", () => {
    const picks = players(["G"], ["G"]);
    expect(canAdd(picks, makePlayer({ id: "neu", positions: ["G"] }))).toBe(false);
    expect(canAdd(picks, makePlayer({ id: "neu", positions: ["G", "F"] }))).toBe(true);
  });
});
