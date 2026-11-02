// @vitest-environment node
import { describe, expect, it } from "vitest";
import { makePool, parsePoolChanges } from "../../scripts/make-pool";
import type { PoolProposal } from "../../scripts/make-pool";

const proposal: PoolProposal = {
  kandidaten: [
    { id: "a", name: "A", bbrefId: "a01", positions: ["G"], selected: true },
    { id: "b", name: "B", bbrefId: "b01", positions: ["F"], selected: false },
  ],
  ergaenzungen: [{ id: "c", name: "C", bbrefId: "c01", positions: ["C"], selected: false }],
};

describe("vorläufiger Pool", () => {
  it("übernimmt nur ausgewählte Kandidaten und nur die vier Pool-Felder", () => {
    expect(makePool(proposal)).toEqual([{ id: "a", name: "A", bbrefId: "a01", positions: ["G"] }]);
  });
  it("wendet Abwahlen und Ergänzungen aus beiden Vorschlagslisten ohne Duplikate an", () => {
    const changes = parsePoolChanges(["--ab", "a", "--hinzu", "b,c,b"]);
    expect(makePool(proposal, changes).map(p => p.id)).toEqual(["b", "c"]);
    expect(makePool(proposal, { hinzu: ["a"] })).toHaveLength(1);
    expect(proposal.kandidaten[0].selected).toBe(true);
  });
  it("meldet unbekannte IDs, widersprüchliche Änderungen und ungültige Argumente", () => {
    expect(() => makePool(proposal, { hinzu: ["unbekannt"] })).toThrow(/unbekannt/);
    expect(() => makePool(proposal, { ab: ["unbekannt"] })).toThrow(/unbekannt/);
    expect(() => makePool(proposal, { ab: ["a"], hinzu: ["a"] })).toThrow(/gleichzeitig/);
    for (const args of [["--falsch", "a"], ["--ab"], ["--hinzu", ""], ["--ab", "--hinzu", "b"]]) {
      expect(() => parsePoolChanges(args)).toThrow();
    }
  });
  it("weist doppelte BBRef-Identitäten und ungültige Positionen zurück", () => {
    expect(() => makePool({ ...proposal, ergaenzungen: [
      { ...proposal.ergaenzungen[0], bbrefId: "a01" },
    ] }, { hinzu: ["c"] })).toThrow(/bbrefId/);
    expect(() => makePool({ kandidaten: [{ ...proposal.kandidaten[0], positions: [] }], ergaenzungen: [] }))
      .toThrow(/Position/);
  });
});
