import { describe, expect, it } from "vitest";
import { teamRating } from "../../src/game/team";
import { CONFIG } from "../../src/config";
import { hash, makeRng, shuffle } from "../../src/game/rng";
import type { Categories, Player } from "../../src/game/types";
import { FIXTURE_POOL, makePlayer } from "../helpers/fixtures";

function five(cats: Partial<Categories> = {}): Player[] {
  return Array.from({ length: 5 }, (_, index) => makePlayer({
    id: `spieler-${index}`,
    cats: { shooter: 60, finisher: 50, playmaking: 70, rebound: 50, defense: 50, oreb: 50, dreb: 50, blk: 80, ...cats },
  }));
}

describe("Teamstärke und Passung", () => {
  it("normalisiert die Scorer-Gewichte und liefert für das Referenzteam net 3,25", () => {
    const rating = teamRating(five());
    expect(rating.off).toBeCloseTo(3.25, 12);
    expect(rating.def).toBe(0);
    // Talent: Stärke 60 der Fixture-Spieler liegt 10 über der Basis 50.
    expect(rating.net).toBeCloseTo(3.25 + 10 * CONFIG.team.talentScale, 12);
    expect(rating.notes.filter((note) => note.kind === "warn")).toEqual([]);
  });

  it("bewertet reine Scorer ohne Ballverteiler niedriger als ein ausgewogenes Team gleicher Summe", () => {
    const scorers = five({ shooter: 90, finisher: 90, playmaking: 0 });
    const balanced = five({ shooter: 60, finisher: 60, playmaking: 60 });
    expect(teamRating(scorers).notes).toContainEqual({ kind: "warn", text: "⚠️ Kein Ballverteiler" });
    expect(teamRating(scorers).net).toBeLessThan(teamRating(balanced).net);
  });

  it("gewichtet Scoring und Playmaking jeweils nach ihrer eigenen Rangfolge", () => {
    const players = five().map((p, index) => ({
      ...p,
      cats: { ...p.cats, shooter: [90, 80, 70, 60, 50][index], finisher: [90, 80, 70, 60, 50][index], playmaking: [20, 40, 60, 80, 90][index] },
    }));
    const scoring = (90 + 80 + 70 * 0.7 + 60 * 0.45 + 50 * 0.3) / 3.45;
    const playmaking = 90 * 0.6 + 80 * 0.25 + 40 * 0.15;
    expect(teamRating(players).net).toBeCloseTo((scoring - 50) * 0.25 + (playmaking - 50) * 0.1 + teamRating(players).talent, 12);
  });

  it("reduziert Finishing bei weniger als zwei Werfern und meldet die Spacing-Grenzen", () => {
    const players = five({ shooter: 54, finisher: 80 });
    players[0].cats.shooter = 55;
    const cramped = teamRating(players);
    expect(cramped.notes).toContainEqual({ kind: "warn", text: "⚠️ Zu wenig Spacing" });
    const scoring = (59.5 + 59 * (1 + 0.7 + 0.45 + 0.3)) / 3.45;
    expect(cramped.off).toBeCloseTo((scoring - 50) * 0.25 + 2, 12);
    players[1].cats.shooter = 55;
    expect(teamRating(players).notes).not.toContainEqual({ kind: "warn", text: "⚠️ Zu wenig Spacing" });
    expect(teamRating(players).notes).not.toContainEqual({ kind: "good", text: "✅ Starkes Spacing" });
    players[2].cats.shooter = 55;
    expect(teamRating(players).notes).toContainEqual({ kind: "good", text: "✅ Starkes Spacing" });
  });

  it("zieht fehlendes Playmaking und fehlende Rim Protection genau an den Schwellen ab", () => {
    const players = five({ playmaking: 59, blk: 69 });
    const rating = teamRating(players);
    expect(rating.net).toBeCloseTo(rating.off + rating.def + rating.talent - 4 - 3, 12);
    expect(rating.notes).toContainEqual({ kind: "warn", text: "⚠️ Kein Rim Protector" });
    const atThreshold = teamRating(five({ playmaking: 60, blk: 70 }));
    expect(atThreshold.notes.filter((note) => note.kind === "warn")).toEqual([]);
    expect(atThreshold.net).toBeCloseTo(atThreshold.off + atThreshold.def + atThreshold.talent, 12);
  });

  it("wertet Offensiv- und Defensivrebounds getrennt und meldet starke Defense und Rebounds", () => {
    const rating = teamRating(five({ defense: 75, rebound: 75, oreb: 70, dreb: 80 }));
    expect(rating.off).toBeCloseTo(3.25 + 20 * 0.04, 12);
    expect(rating.def).toBeCloseTo(25 * 0.15 + 30 * 0.05, 12);
    expect(rating.notes).toContainEqual({ kind: "good", text: "✅ Elite-Defense" });
    expect(rating.notes).toContainEqual({ kind: "good", text: "✅ Rebound-Maschine" });
    const below = teamRating(five({ defense: 74, rebound: 74 }));
    expect(below.notes.some((note) => /Elite|Rebound/.test(note.text))).toBe(false);
  });

  it("ist einschließlich Notes exakt unabhängig von der Spielerreihenfolge und verändert die Eingabe nicht", async () => {
    const players = [FIXTURE_POOL[0], FIXTURE_POOL[17], FIXTURE_POOL[28], FIXTURE_POOL[39], FIXTURE_POOL[52]];
    const before = structuredClone(players);
    const rating = teamRating(players);
    for (let index = 0; index < 1000; index++) {
      if (index % 200 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
      expect(teamRating(shuffle(makeRng(hash(`reihenfolge-${index}`)), players))).toEqual(rating);
    }
    expect(players).toEqual(before);
  });

  it("rechnet die Gesamtstärke der Spieler als Talent ein, damit dominante Spieler mehr bringen", () => {
    const weak = five().map((p) => ({ ...p, strength: 50 }));
    const strong = five().map((p) => ({ ...p, strength: 90 }));
    expect(teamRating(strong).net - teamRating(weak).net).toBeCloseTo(40 * CONFIG.team.talentScale, 12);
    expect(CONFIG.team.talentScale).toBeGreaterThan(0);
  });
});
