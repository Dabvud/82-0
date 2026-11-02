import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { CONFIG } from "../src/config";
import type { NbaTeam, Player } from "../src/game/types";
import { normalizeName } from "../src/model/names";
import { seasonRaw } from "../src/model/normalize";
import { allTimerPcts, capForTenure, franchiseStreak, isOverpaid, pricePct, valueResiduals } from "../src/model/price";
import { assignTiers, toCategories } from "../src/model/rating";
import { accoladesFrom, eliteBySeason, pickStrengthPeak, seasonValue } from "../src/model/strength";
import type { LeagueAvg, SeasonLine } from "../src/model/types";
import { loadSources, parseCsv } from "./lib/sources";
import type { PoolPlayer } from "./make-pool";

export interface Estimate {
  tovPer36: number | null;
  orbShare: number | null;
  stlPer36: number | null;
  blkPer36: number | null;
  reason: string;
}
export interface Salary { season: number; name: string; team: string; salary: number }
export type ManualContract = Omit<Salary, "name">;
export interface ContractPlayer { id: string; name: string; first: number; last: number }
type Caps = Record<string, number>;
type RatedContract = ManualContract & { capShare: number };

export function applyEstimates(source: SeasonLine, estimate?: Estimate): {
  line: SeasonLine; estimatedFields: (keyof SeasonLine)[]; missing: (keyof SeasonLine)[];
} {
  const line = { ...source };
  const estimatedFields: (keyof SeasonLine)[] = [];
  if (line.season < 1980) { line.x3p = 0; line.x3pPct = null; }
  for (const [field, rate] of [["tov", "tovPer36"], ["stl", "stlPer36"], ["blk", "blkPer36"]] as const) {
    const value = estimate?.[rate];
    if (line[field] === null && value != null) {
      line[field] = value * (line.mp ?? 36) / 36;
      estimatedFields.push(field);
    }
  }
  if (line.orb === null && line.trb !== null && estimate?.orbShare != null) {
    line.orb = line.trb * estimate.orbShare;
    estimatedFields.push("orb");
  }
  if (line.drb === null && line.trb !== null && line.orb !== null) {
    line.drb = line.trb - line.orb;
    if (estimatedFields.includes("orb")) estimatedFields.push("drb");
  }
  const required: (keyof SeasonLine)[] = ["x2p", "x2pPct", "x3p", "ftm", "fta", "ftPct", "ast", "tov", "orb", "drb", "trb", "stl", "blk"];
  if (line.x3p !== 0) required.push("x3pPct");
  return { line, estimatedFields,
    missing: required.filter(field => line[field] == null || !Number.isFinite(line[field])) };
}

function contractEnd(player: ContractPlayer): number {
  return Math.min(2027, player.last + 1);
}

export function findContract(player: ContractPlayer, salaries: Salary[], manual: ManualContract | null | undefined,
  caps: Caps): RatedContract | null {
  const name = normalizeName(player.name);
  const candidates: ManualContract[] = salaries.filter(entry => normalizeName(entry.name) === name
    && entry.season >= player.first && entry.season <= contractEnd(player));
  if (manual) candidates.push(manual);
  let best: RatedContract | null = null;
  for (const { season, team, salary } of candidates) {
    const cap = caps[String(season)];
    if (!Number.isFinite(cap) || cap <= 0) throw new Error(`Salary Cap fehlt oder ist ungültig: ${player.id}, ${season}`);
    if (!Number.isFinite(salary) || salary <= 0) throw new Error(`Ungültiges Gehalt: ${player.id}, ${season}`);
    const capShare = salary / cap;
    if (best === null || capShare > best.capShare) best = { season, team, salary, capShare };
  }
  return best;
}

export function findAmbiguousNames(players: ContractPlayer[]): { name: string; ids: string[]; from: number; to: number }[] {
  const ambiguities: { name: string; ids: string[]; from: number; to: number }[] = [];
  players.forEach((player, index) => {
    for (const other of players.slice(index + 1)) {
      const from = Math.max(player.first, other.first);
      const to = Math.min(contractEnd(player), contractEnd(other));
      const name = normalizeName(player.name);
      if (name === normalizeName(other.name) && from <= to) {
        ambiguities.push({ name, ids: [player.id, other.id].sort(), from, to });
      }
    }
  });
  return ambiguities;
}

function leagueForRating(league: LeagueAvg): LeagueAvg {
  // 1955 ist die Freiwurfquote nur über die erfassten Treffer und Versuche bestimmbar.
  return league.ftPct === 0 && league.ftm !== null && league.fta !== null && league.fta > 0
    ? { ...league, ftPct: league.ftm / league.fta } : league;
}

/** Fehlende Felder als 0, Dreier vor 1980 als 0 – wie bei der Elite-Berechnung. */
function zeroFilled(line: SeasonLine): SeasonLine {
  const filled = Object.fromEntries(Object.entries(line).map(([key, value]) => [key, value ?? 0])) as unknown as SeasonLine;
  return line.season < 1980 ? { ...filled, x3p: 0, x3pPct: null } : filled;
}

/** Perzentil 0–99 je Wert (gleiche Werte teilen sich den mittleren Rang). */
function percentiles(values: number[]): number[] {
  return values.map(value => {
    const lower = values.filter(other => other < value).length;
    const equal = values.filter(other => other === value).length;
    return values.length === 1 ? CONFIG.categoryMax / 2 : (lower + (equal - 1) / 2) / (values.length - 1) * CONFIG.categoryMax;
  });
}

/** Vom Nutzer festgelegte Tiers (z. B. „nur absolute Stars in T1“) überschreiben die berechneten. */
export function applyTierOverrides(ids: string[], tiers: (1 | 2 | 3 | 4 | 5)[], overrides: Record<string, number>): (1 | 2 | 3 | 4 | 5)[] {
  const result = [...tiers];
  for (const [id, tier] of Object.entries(overrides)) {
    const index = ids.indexOf(id);
    if (index < 0) throw new Error(`Tier-Korrektur für unbekannte ID: ${id}`);
    if (![1, 2, 3, 4, 5].includes(tier)) throw new Error(`Ungültiges Tier ${tier} für ${id}`);
    result[index] = tier as 1 | 2 | 3 | 4 | 5;
  }
  return result;
}

/** Team je Spieler und Saison: Einzelteam-Zeile mit den meisten Spielen (ohne TOT/2TM-Sammelzeilen). */
export function teamsBySeasonFrom(csv: string): Map<string, Map<number, string>> {
  const best = new Map<string, { g: number; team: string }>();
  for (const row of parseCsv(csv)) {
    if ((row.lg !== "NBA" && row.lg !== "BAA") || row.team === "TOT" || /^\d+TM$/.test(row.team)) continue;
    const key = row.player_id + "|" + row.season;
    const g = Number(row.g);
    if (!best.has(key) || g > best.get(key)!.g) best.set(key, { g, team: row.team });
  }
  const result = new Map<string, Map<number, string>>();
  for (const [key, { team }] of best) {
    const [id, season] = key.split("|");
    const seasons = result.get(id) ?? new Map<number, string>();
    seasons.set(Number(season), team);
    result.set(id, seasons);
  }
  return result;
}

const readJson = <T,>(path: string): T => JSON.parse(readFileSync(path, "utf8"));

export function buildPlayers(pool: PoolPlayer[], sources: ReturnType<typeof loadSources>, estimates: Record<string, Estimate>,
  salaries: Salary[], manual: Record<string, ManualContract | null>, caps: Caps,
  extra: { teamsBySeason: Map<string, Map<number, string>>; accolades: Map<string, number>; tierOverrides?: Record<string, number> } = { teamsBySeason: new Map(), accolades: new Map() }) {
  const errors: string[] = [];
  const prepared = pool.map(player => {
    // Saisons ohne Rebound-Erfassung (BAA 1949/50) zählen nicht (Ruling).
    const seasons = (sources.seasonsByPlayer.get(player.bbrefId) ?? []).filter(line => line.trb !== null);
    if (!seasons.length) errors.push(`${player.id}: keine NBA/BAA-Saisons`);
    const rated = seasons.map(source => {
      const result = applyEstimates(source, estimates[player.id]);
      if (result.missing.length) errors.push(`${player.id}, ${source.season}: ${result.missing.join(", ")}`);
      if (!sources.league.has(source.season)) errors.push(`${player.id}, ${source.season}: Liga-Durchschnitt fehlt`);
      return result;
    });
    return { player, rated, first: Math.min(...seasons.map(line => line.season)), last: Math.max(...seasons.map(line => line.season)) };
  });
  if (errors.length) throw new Error(`Datenbuild abgebrochen – ungelöste Datenlücken:\n${errors.map(error => `- ${error}`).join("\n")}`);

  // Saison-Elite über ALLE Spieler (ohne Schätzwerte, fehlende Felder = 0), damit Epochen fair verglichen werden.
  const valueOf = (line: SeasonLine) => seasonValue(zeroFilled(line), leagueForRating(sources.league.get(line.season)!));
  const eliteEntries: { season: number; value: number; g: number; mp: number | null | undefined }[] = [];
  for (const lines of sources.seasonsByPlayer.values()) {
    for (const line of lines) {
      if (line.trb === null || !sources.league.has(line.season)) continue;
      eliteEntries.push({ season: line.season, value: valueOf(line), g: line.g, mp: line.mp });
    }
  }
  const elite = eliteBySeason(eliteEntries, CONFIG.strengthModel.eliteQuantile);

  const peaks = prepared.map(({ player, rated }) => {
    const lines = rated.map(entry => entry.line);
    const peak = pickStrengthPeak(lines.map(line => ({
      season: line.season, g: line.g,
      rel: valueOf(sources.seasonsByPlayer.get(player.bbrefId)!.find(source => source.season === line.season)!) / elite.get(line.season)!,
      acc: extra.accolades.get(`${player.bbrefId}|${line.season}`) ?? 0,
    })), CONFIG.strengthModel.accoladeWeight);
    const hasValid = lines.some(line => line.g >= CONFIG.minGames);
    const used = rated.filter(({ line }) => line.season >= peak.from && line.season <= peak.to && (!hasValid || line.g >= CONFIG.minGames));
    const raws = used.map(({ line }) => {
      const raw = seasonRaw(line, leagueForRating(sources.league.get(line.season)!));
      if (Object.values(raw).some(value => !Number.isFinite(value))) throw new Error(`Ungültige Rohwerte: ${player.id}, ${line.season}`);
      return raw;
    });
    const keys = Object.keys(raws[0]) as (keyof typeof raws[0])[];
    const raw = Object.fromEntries(keys.map(key => [key, raws.reduce((sum, r) => sum + r[key], 0) / raws.length])) as unknown as typeof raws[0];
    // Nur tatsächlich verwendete Peak-Saisons markieren, nicht ausgeschlossene Kurzsaisons dazwischen.
    const estimated = used.some(({ estimatedFields }) => estimatedFields.length > 0);
    // Peak-Werte pro Spiel für die Ergebnis-Statistik (inklusive Schätzwerte).
    const avg = (f: (l: SeasonLine) => number) => used.reduce((sum, { line }) => sum + f(line), 0) / used.length;
    const r1 = (x: number) => Math.round(x * 10) / 10;
    const box = {
      pts: r1(avg(l => 2 * (l.x2p ?? 0) + 3 * (l.x3p ?? 0) + (l.ftm ?? 0))), reb: r1(avg(l => l.trb ?? 0)),
      ast: r1(avg(l => l.ast ?? 0)), stl: r1(avg(l => l.stl ?? 0)), blk: r1(avg(l => l.blk ?? 0)),
      fg3m: r1(avg(l => l.x3p ?? 0)), fg3a: Math.round(avg(l => (l.x3p && l.x3pPct ? l.x3p / l.x3pPct : 0)) * 100) / 100,
    };
    return { from: peak.from, to: peak.to, value: peak.value, raw, estimated, box };
  });
  const cats = toCategories(peaks.map(peak => peak.raw));
  const strengths = percentiles(peaks.map(peak => peak.value));
  const tiers = applyTierOverrides(pool.map(player => player.id), assignTiers(strengths), extra.tierOverrides ?? {});
  const careers = prepared.map(({ player, first, last }) => ({ ...player, first, last }));
  const contracts = careers.map(player => findContract(player, salaries, manual[player.id], caps));
  const prices = contracts.map((contract, index) => contract
    ? pricePct(contract.capShare, tiers[index], capForTenure(franchiseStreak(extra.teamsBySeason.get(careers[index].bbrefId) ?? new Map(), contract.season)))
    : pricePct(null, tiers[index]));
  // Nutzerregel: All-Timer (Tier 1–2) ohne belegtes Gehalt kosten 30–35 %, gestaffelt nach Stärke.
  const allTimers = prices.map((price, index) => price.source === "tier" && tiers[index] <= 2 ? index : -1).filter(index => index >= 0);
  allTimerPcts(allTimers.map(index => strengths[index])).forEach((pct, i) => { prices[allTimers[i]] = { pct, source: "tier" }; });
  const values = valueResiduals(strengths, prices.map(price => price.pct));
  const capNow = caps["2027"];
  if (!Number.isFinite(capNow) || capNow <= 0) throw new Error("Salary Cap für 2027 fehlt oder ist ungültig.");
  const players: Player[] = pool.map((player, index) => ({
    id: player.id, name: player.name, positions: player.positions,
    peak: { from: peaks[index].from, to: peaks[index].to }, cats: cats[index],
    strength: strengths[index], tier: tiers[index],
    price: Math.floor(prices[index].pct * capNow / 10_000) * 10_000, priceSource: prices[index].source,
    contract: contracts[index] ? { season: contracts[index].season, team: contracts[index].team } : null,
    value: values[index], overpaid: isOverpaid(values[index]), estimated: peaks[index].estimated, box: peaks[index].box,
  }));
  return { players, ambiguities: findAmbiguousNames(careers) };
}

export function buildTeams(csv: string): NbaTeam[] {
  const teams = parseCsv(csv).filter(row => row.season === "2026" && row.lg === "NBA" && row.team !== "League Average")
    .map(row => ({ abbr: row.abbreviation, name: row.team, net: Number(row.n_rtg) }));
  if (teams.length !== 30 || new Set(teams.map(team => team.abbr)).size !== 30
    || teams.some(team => !team.abbr || !team.name || !Number.isFinite(team.net))) {
    throw new Error("Team Summaries 2026: 30 eindeutige NBA-Teams mit gültigem n_rtg erwartet.");
  }
  return teams;
}

export function buildReport(players: Player[], ambiguities: ReturnType<typeof findAmbiguousNames>): string {
  const money = (price: number) => `${price.toLocaleString("de-DE")} $`;
  const row = (p: Player) => `| ${p.name} (${p.id}) | ${p.tier} | ${money(p.price)} | ${p.value.toFixed(2)} | ${p.overpaid} |`;
  const table = (list: Player[]) => ["| Spieler (ID) | Tier | Preis | value | overpaid |", "| --- | ---: | ---: | ---: | --- |", ...list.map(row)];
  const lines = ["# Build-Bericht", "", `Vorläufiger Pool: ${players.length} Spieler. Stärke: strengthsFromRaw; Preise auf 10.000 $ gerundet.`, "",
    "## Tiers und Positionen", "", "| Tier | Spieler | G | F | C |", "| --- | ---: | ---: | ---: | ---: |"];
  const shortages: string[] = [];
  for (const tier of [1, 2, 3, 4, 5] as const) {
    const group = players.filter(player => player.tier === tier);
    const counts = (["G", "F", "C"] as const).map(pos => group.filter(player => player.positions.includes(pos)).length);
    lines.push(`| ${tier} | ${group.length} | ${counts.join(" | ")} |`);
    (["G", "F", "C"] as const).forEach((pos, index) => {
      const min = pos === "C" ? 5 : 10;
      if (counts[index] < min) shortages.push(`Tier ${tier}: ${pos} = ${counts[index]} < ${min}`);
    });
  }
  lines.push("", "Positions-Mindestwerte: " + (shortages.length ? `**VERFEHLT** – ${shortages.join("; ")}. Datentest bleibt rot; Nutzerentscheidung offen.` : "alle erfüllt."));
  const byValue = [...players].sort((a, b) => a.value - b.value || a.id.localeCompare(b.id));
  lines.push("", "## Top 15 überbezahlt (niedrigster value)", "", ...table(byValue.slice(0, 15)),
    "", "## Top 15 Schnäppchen (höchster value)", "", ...table([...byValue].reverse().slice(0, 15)),
    "", '## Spieler mit priceSource "tier"', "");
  const fallbackIds = players.filter(player => player.priceSource === "tier").map(player => player.id).sort();
  // Der Daten-Test vergleicht diesen maschinenlesbaren Block mit einem festen ID-Snapshot.
  lines.push("```json", JSON.stringify(fallbackIds, null, 2), "```", "", "## Plausibilität", "");
  const ids = ["bradley-beal", "michael-jordan", "lebron-james", "nikola-jokic", "shaquille-oneal", "stephen-curry", "victor-wembanyama"];
  lines.push(...table(ids.flatMap(id => players.filter(player => player.id === id))));
  for (const id of ids) if (!players.some(player => player.id === id)) lines.push(`- ${id}: nicht im Pool.`);
  lines.push("", "## Mehrdeutige ESPN-Namen", "",
    ...(ambiguities.length ? ambiguities.map(entry => `- ${entry.name}: ${entry.ids.join(", ")} (${entry.from}–${entry.to}); Zuordnung prüfen.`) : ["Keine überlappenden Namensvettern im Pool."]),
    "", "## Hinweise", "", `- ${players.filter(player => player.estimated).length} Spieler verwenden im Peak Schätzraten.`,
    "- Nur NBA/BAA-Saisons; historische Liga-Lücken mit dem ersten erfassten Ligawert gefüllt. Vor 1980: keine Dreier.",
    "- ESPN 2003–2005 enthält akzeptierte Lücken (280/180/120 Einträge); einzelne Rollenspieler können dadurch zu billig sein.",
    "- Pool, historische Verträge und Schätzraten sind vorläufig; nach der Nutzerauswahl neu bauen.", "");
  return lines.join("\n");
}

export function main() {
  mkdirSync(".superpowers", { recursive: true });
  try {
    const { players, ambiguities } = buildPlayers(readJson<PoolPlayer[]>("data/manual/pool.json"), loadSources(),
      readJson<Record<string, Estimate>>("data/manual/estimates.json"), readJson<Salary[]>("data/raw/espn-salaries.json"),
      readJson<Record<string, ManualContract | null>>("data/manual/contracts-pre2000.json"),
      readJson<{ caps: Caps }>("data/manual/salary-cap.json").caps, {
        teamsBySeason: teamsBySeasonFrom(readFileSync("data/source/Player Per Game.csv", "utf8")),
        accolades: accoladesFrom(parseCsv(readFileSync("data/source/End of Season Teams.csv", "utf8")),
          parseCsv(readFileSync("data/source/Player Award Shares.csv", "utf8"))),
        tierOverrides: existsSync("data/manual/tier-overrides.json") ? readJson<Record<string, number>>("data/manual/tier-overrides.json") : {},
      });
    const teams = buildTeams(readFileSync("data/source/Team Summaries.csv", "utf8"));
    const report = buildReport(players, ambiguities);
    mkdirSync("src/data", { recursive: true });
    writeFileSync("src/data/players.json", `${JSON.stringify(players, null, 2)}\n`, "utf8");
    writeFileSync("src/data/teams.json", `${JSON.stringify(teams, null, 2)}\n`, "utf8");
    writeFileSync(".superpowers/build-bericht.md", report, "utf8");
    console.log(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    writeFileSync(".superpowers/build-bericht.md", `# Build-Bericht\n\n**ABGEBROCHEN**\n\n${message}\n`, "utf8");
    throw error;
  }
}

// Unter Vitest nur importieren, sonst (vite-node) direkt ausführen.
if (!process.env.VITEST) main();
