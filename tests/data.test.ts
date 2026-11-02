// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BUDGET, CAP_NOW, LUXURY_LINE, MIN_PRICE, PLAYERS, TEAMS } from "../src/data";
import { CONFIG } from "../src/config";
import salaryCap from "../data/manual/salary-cap.json";
import pool from "../data/manual/pool.json";

describe("generierte Spieldaten", () => {
  it("enthält 250–330 Spieler (Nutzer wählte 314), eindeutige Identitäten und gültige Positionen", () => {
    expect(PLAYERS.length).toBeGreaterThanOrEqual(250);
    expect(PLAYERS.length).toBeLessThanOrEqual(330);
    expect(new Set(PLAYERS.map(player => player.id)).size).toBe(PLAYERS.length);
    expect(new Set(pool.map(player => player.bbrefId)).size).toBe(pool.length);
    expect(PLAYERS.map(player => player.id)).toEqual(pool.map(player => player.id));
    for (const player of PLAYERS) {
      expect(player.positions.length, player.id).toBeGreaterThan(0);
      expect(player.positions.every(pos => ["G", "F", "C"].includes(pos)), player.id).toBe(true);
      expect(new Set(player.positions).size, player.id).toBe(player.positions.length);
    }
  });
  it("hält Kategorien und Stärke im Bereich 0–99 sowie Peak, value und Preis gültig", () => {
    for (const player of PLAYERS) {
      for (const value of [...Object.values(player.cats), player.strength]) {
        expect(Number.isFinite(value), player.id).toBe(true);
        expect(value, player.id).toBeGreaterThanOrEqual(0);
        expect(value, player.id).toBeLessThanOrEqual(99);
      }
      expect(player.peak.from, player.id).toBeLessThanOrEqual(player.peak.to);
      expect(Number.isFinite(player.value), player.id).toBe(true);
      expect(player.overpaid, player.id).toBe(player.value < -CONFIG.overpaidMargin);
      expect(player.price, player.id).toBeGreaterThan(0);
      expect(player.price % 10_000, player.id).toBe(0);
      expect(player.contract === null, player.id).toBe(player.priceSource === "tier");
    }
  });
  it("begrenzt jeden Spielerpreis auf 35 % des aktuellen Salary Caps", () => {
    const violations = PLAYERS.filter(player => player.price > 0.35 * CAP_NOW).map(player => ({ id: player.id, price: player.price }));
    expect(violations).toEqual([]);
  });
  it.each([1, 2, 3, 4, 5])("Tier %i enthält mindestens 10 G, 10 F und 5 C", tier => {
    const players = PLAYERS.filter(player => player.tier === tier);
    expect(players.filter(player => player.positions.includes("G")).length, `Tier ${tier}: G`).toBeGreaterThanOrEqual(10);
    expect(players.filter(player => player.positions.includes("F")).length, `Tier ${tier}: F`).toBeGreaterThanOrEqual(10);
    expect(players.filter(player => player.positions.includes("C")).length, `Tier ${tier}: C`).toBeGreaterThanOrEqual(5);
  });
  it("exportiert Cap, Budget, Luxusgrenze und Mindestpreis aus den vereinbarten Quellen", () => {
    expect(CAP_NOW).toBe(salaryCap.caps["2027"]);
    expect(BUDGET).toBe(CAP_NOW * CONFIG.budgetPct);
    expect(LUXURY_LINE).toBe(CAP_NOW * CONFIG.luxuryPct);
    expect(MIN_PRICE).toBe(Math.min(...PLAYERS.map(player => player.price)));
  });
  it("enthält genau 30 eindeutige Teams mit net zwischen −20 und +20", () => {
    expect(TEAMS).toHaveLength(30);
    expect(new Set(TEAMS.map(team => team.abbr)).size).toBe(30);
    for (const team of TEAMS) {
      expect(team.name).not.toBe("League Average");
      expect(team.net).toBeGreaterThanOrEqual(-20);
      expect(team.net).toBeLessThanOrEqual(20);
    }
  });
  it("hält die Ersatzpreis-IDs als Snapshot fest und nennt sie vollständig im Bericht", () => {
    const ids = PLAYERS.filter(player => player.priceSource === "tier").map(player => player.id).sort();
    expect(ids).toMatchInlineSnapshot(`
      [
        "bill-russell",
        "bill-walton",
        "bob-cousy",
        "bob-mcadoo",
        "bob-pettit",
        "david-thompson",
        "elgin-baylor",
        "elvin-hayes",
        "george-mikan",
        "jakob-poltl",
        "jerry-west",
        "john-havlicek",
        "oscar-robertson",
        "pete-maravich",
        "rick-barry",
        "walt-frazier",
        "wes-unseld",
        "willis-reed",
        "wilt-chamberlain",
      ]
    `);
    // Der Build-Bericht liegt nur lokal (gitignored); auf GitHub zählt allein der Snapshot oben.
    if (!existsSync(".superpowers/build-bericht.md")) return;
    const report = readFileSync(".superpowers/build-bericht.md", "utf8");
    const match = report.match(/## Spieler mit priceSource "tier"\s+```json\n([\s\S]*?)\n```/);
    expect(match).not.toBeNull();
    expect(JSON.parse(match![1])).toEqual(ids);
  });
  it("erfüllt die vereinbarten Plausibilitätsanker", () => {
    expect(PLAYERS.find(player => player.id === "bradley-beal")?.overpaid).toBe(true);
    for (const id of ["michael-jordan", "lebron-james", "nikola-jokic"]) {
      expect(PLAYERS.find(player => player.id === id)?.tier, id).toBe(1);
    }
  });
});
