// @vitest-environment node
import { describe, expect, it } from "vitest";
import { applyEstimates, buildPlayers, buildReport, buildTeams, findContract, findAmbiguousNames } from "../../scripts/build-players";
import type { ContractPlayer, Estimate, Salary } from "../../scripts/build-players";
import type { LeagueAvg, SeasonLine } from "../../src/model/types";
import type { PoolPlayer } from "../../scripts/make-pool";
import type { loadSources } from "../../scripts/lib/sources";

const line: SeasonLine = {
  season: 1973, g: 80, mp: 42, x2p: 9, x2pPct: 0.5, x3p: null, x3pPct: null,
  ftm: 5, fta: 6, ftPct: 0.8, ast: 4, tov: null, orb: null, drb: null,
  trb: 15, stl: null, blk: null, allDef1: false, allDef2: false,
};
const estimate: Estimate = { tovPer36: 3, orbShare: 0.3, stlPer36: 1.2, blkPer36: 2.4, reason: "Test" };

describe("Schätzraten anwenden", () => {
  it("rechnet mit Minuten und TRB, setzt historische Dreier und verändert keine Quelldaten", () => {
    const result = applyEstimates(line, estimate);
    expect(result.line).toMatchObject({ tov: 3.5, orb: 4.5, drb: 10.5, x3p: 0, x3pPct: null });
    expect(result.line.stl).toBeCloseTo(1.4);
    expect(result.line.blk).toBeCloseTo(2.8);
    expect(result.estimatedFields.sort()).toEqual(["blk", "drb", "orb", "stl", "tov"]);
    expect(result.missing).toEqual([]);
    expect(line.tov).toBeNull();
  });
  it("nutzt 36 Minuten nur bei fehlenden Minuten und überschreibt keine gemessenen Werte", () => {
    const result = applyEstimates({ ...line, mp: null, stl: 0, orb: 2 }, estimate);
    expect(result.line).toMatchObject({ tov: 3, stl: 0, blk: 2.4, orb: 2, drb: 13 });
    expect(result.estimatedFields).not.toContain("stl");
    expect(applyEstimates({ ...line, mp: 0 }, estimate).line.tov).toBe(0);
  });
  it("meldet unlösbare Lücken statt Nullen zu erfinden und akzeptiert partielle Schätzungen", () => {
    expect(applyEstimates(line).missing.sort()).toEqual(["blk", "drb", "orb", "stl", "tov"]);
    expect(applyEstimates({ ...line, trb: null }, estimate).missing).toEqual(expect.arrayContaining(["trb", "orb", "drb"]));
    expect(applyEstimates(line, { ...estimate, stlPer36: null }).missing).toContain("stl");
    expect(applyEstimates({ ...line, x2p: null }, estimate).missing).toContain("x2p");
  });
  it("setzt ausschließlich Saisons vor 1980 auf null Dreier und markiert diese Regel nicht als Schätzung", () => {
    const complete = { ...line, tov: 2, orb: 3, drb: 12, stl: 1, blk: 2 };
    expect(applyEstimates(complete).estimatedFields).toEqual([]);
    expect(applyEstimates({ ...complete, season: 1980 }).missing).toContain("x3p");
    expect(applyEstimates({ ...complete, season: 1980, x3p: 0 }).missing).toEqual([]);
    expect(applyEstimates({ ...complete, season: 1980, x3p: 1 }).missing).toContain("x3pPct");
  });
});

describe("Vertragssuche", () => {
  const player: ContractPlayer = { id: "gary", name: "Gary Payton II", first: 2017, last: 2027 };
  const caps = { "2003": 40, "2017": 80, "2026": 100, "2027": 120, "2028": 125 };
  const salaries: Salary[] = [
    { season: 2003, name: "Gary Payton", team: "Alt", salary: 39 },
    { season: 2017, name: "Gary Payton II", team: "A", salary: 24 },
    { season: 2026, name: "Gary Payton Jr.", team: "B", salary: 28 },
    { season: 2028, name: "Gary Payton II", team: "Zukunft", salary: 125 },
    { season: 2027, name: "Anderer Name", team: "Falsch", salary: 120 },
  ];
  it("normalisiert Namen, begrenzt Karrierejahre und maximiert Cap-Anteil statt Dollar", () => {
    expect(findContract(player, salaries, null, caps)).toEqual({
      season: 2017, team: "A", salary: 24, capShare: 0.3,
    });
  });
  it("nimmt bei Aktiven 2027 auch ohne aktuelle Statistik und erlaubt sonst last + 1", () => {
    const entry = { season: 2027, name: "Gary Payton II", team: "Aktiv", salary: 60 };
    expect(findContract({ ...player, last: 2026 }, [entry], null, caps)?.season).toBe(2027);
    expect(findContract({ ...player, last: 2016 }, salaries, null, caps)?.season).toBe(2017);
    expect(findContract({ ...player, first: 2018, last: 2020 }, salaries, null, caps)).toBeNull();
  });
  it("vergleicht manuelle Verträge mit ESPN und behandelt fehlende Verträge als null", () => {
    expect(findContract(player, salaries, { season: 2003, team: "Manuell", salary: 20 }, caps))
      .toEqual({ season: 2003, team: "Manuell", salary: 20, capShare: 0.5 });
    expect(findContract(player, [], null, caps)).toBeNull();
    expect(() => findContract(player, [{ ...salaries[1], season: 2020 }], null, caps)).toThrow(/2020/);
  });
  it("meldet nur Namensvettern mit überlappenden zulässigen Vertragsjahren", () => {
    const other = { ...player, id: "senior", name: "Gary Payton", first: 1991, last: 2007 };
    expect(findAmbiguousNames([player, other])).toEqual([]);
    expect(findAmbiguousNames([player, { ...other, last: 2016 }])).toEqual([
      { name: "gary payton", ids: ["gary", "senior"], from: 2017, to: 2017 },
    ]);
  });
});

describe("Pipeline", () => {
  const pool: PoolPlayer[] = [
    { id: "dominant", bbrefId: "dominant01", name: "Dominant", positions: ["C"] },
    { id: "balanced", bbrefId: "balanced01", name: "Balanced", positions: ["G"] },
    { id: "average", bbrefId: "average01", name: "Average", positions: ["F"] },
  ];
  const base = { ...line, season: 2027, mp: 36, x3p: 1, x3pPct: 0.35, tov: 2, orb: 2, drb: 6, stl: 1, blk: 1 };
  const league: LeagueAvg = { x2p: 30, x2pPct: 0.5, x3p: 10, x3pPct: 0.35, ftm: 20, fta: 25,
    ftPct: 0.8, ast: 25, tov: 12, orb: 10, drb: 30, trb: 40, stl: 8, blk: 5 };
  const sources = (): ReturnType<typeof loadSources> => ({
    seasonsByPlayer: new Map([
      ["dominant01", [{ ...base, x2p: 60 }]],
      ["balanced01", [{ ...base, x3p: 1.5, ast: 6, orb: 3, drb: 7, stl: 2, blk: 2 }]],
      ["average01", [{ ...base }]],
    ]),
    league: new Map([[2027, league]]), playerInfo: new Map(),
  });
  it("bewertet dominante Rohwerte vor ausgeglichenen Kategorie-Perzentilen und baut Preise samt Vertrag", () => {
    const { players } = buildPlayers(pool, sources(), {}, [
      { name: "Dominant", season: 2027, team: "Team", salary: 25_001_000 },
    ], {}, { "2027": 100_000_000 });
    expect(players.map(player => player.strength)).toEqual([99, 49.5, 0]);
    expect(players[0]).toMatchObject({ tier: 1, price: 25_000_000, priceSource: "contract",
      contract: { season: 2027, team: "Team" }, estimated: false, peak: { from: 2027, to: 2027 } });
    // Nutzerregel: Tier 1–2 ohne Vertrag zahlt 30–35 % (einziger in der Gruppe → 35 %).
    expect(players[1]).toMatchObject({ tier: 2, price: 35_000_000, priceSource: "tier", contract: null });
    // Tier 3 ohne Vertrag bleibt bei der Marktwert-Stufe.
    expect(players[2]).toMatchObject({ tier: 3, price: 14_000_000, priceSource: "tier" });
    expect(players.reduce((sum, player) => sum + player.value, 0)).toBeCloseTo(0);
  });
  it("markiert Schätzungen nur in berücksichtigten Peak-Saisons", () => {
    const data = sources();
    data.league.set(2026, league);
    data.seasonsByPlayer.get("average01")!.push({ ...base, season: 2026, g: 5, tov: null });
    expect(buildPlayers(pool, data, { average: estimate }, [], {}, { "2027": 100_000_000 }).players[2].estimated).toBe(false);
    data.seasonsByPlayer.get("average01")![0].tov = null;
    expect(buildPlayers(pool, data, { average: estimate }, [], {}, { "2027": 100_000_000 }).players[2].estimated).toBe(true);
  });
  it("sammelt ungelöste Spielerlücken für alle Saisons in einem Abbruch", () => {
    const data = sources();
    data.seasonsByPlayer.get("dominant01")![0].tov = null;
    data.seasonsByPlayer.get("balanced01")![0].blk = null;
    expect(() => buildPlayers(pool, data, {}, [], {}, { "2027": 100_000_000 }))
      .toThrow(/dominant, 2027: tov\n- balanced, 2027: blk/);
  });
  it("meldet Positionsmangel und führt alle Ersatzpreise maschinenlesbar im Bericht auf", () => {
    const result = buildPlayers(pool, sources(), {}, [], {}, { "2027": 100_000_000 });
    const report = buildReport(result.players, []);
    expect(report).toContain("**VERFEHLT**");
    expect(report).toContain("Datentest bleibt rot");
    const match = report.match(/```json\n([\s\S]*?)\n```/);
    expect(JSON.parse(match![1])).toEqual(["average", "balanced", "dominant"]);
  });
  it("liest ausschließlich die 30 NBA-Teams von 2026 samt n_rtg", () => {
    const rows = Array.from({ length: 30 }, (_, i) => `2026,NBA,Team ${i},T${i},${i / 2 - 7}`);
    const csv = ["season,lg,team,abbreviation,n_rtg", ...rows,
      "2026,NBA,League Average,,0", "2027,NBA,Neues Team,NEW,12", "2026,ABA,ABA-Team,ABA,15"].join("\n");
    const teams = buildTeams(csv);
    expect(teams).toHaveLength(30);
    expect(teams[0]).toEqual({ abbr: "T0", name: "Team 0", net: -7 });
    expect(() => buildTeams(csv.replace("Team 0,T0,-7", "Team 0,T0,NA"))).toThrow();
    expect(() => buildTeams(csv.replace(rows[0], ""))).toThrow();
  });
});
