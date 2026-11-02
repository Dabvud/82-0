import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { normalizeName } from "../src/model/names";
import { seasonRaw } from "../src/model/normalize";
import { pickPeak, strengthsFromRaw } from "../src/model/rating";
import type { LeagueAvg, Pos, SeasonLine } from "../src/model/types";
import { loadSources, parseCsv } from "./lib/sources";

interface TncPlayer {
  id: string; name: string; tier: 1 | 2 | 3; group: string; position: string;
  stations: { from: number; to: number | null }[];
}
export interface PoolCandidate {
  id: string; name: string; bbrefId: string; positions: Pos[]; group: string;
  tncTier: number | null; strength: number; peak: { from: number; to: number };
  selected: boolean; grund: string;
}
type PlayerInfo = ReturnType<typeof loadSources>["playerInfo"];

// Belegte Schreibweisen aus den Quellen dienen ausschließlich der manuellen Prüfung.
const reviewNameHints: Record<string, string> = {
  "cam johnson": "cameron johnson",
  "jakob poltl": "jakob poeltl",
  "penny hardaway": "anfernee hardaway",
};

// Vom Prüfer festgelegt (2026-11-02): Namensvarianten fest zuordnen, TNC-Doppeleinträge überspringen.
const MANUAL_IDS: Record<string, string> = { "jakob-poltl": "poeltja01", "penny-hardaway": "hardaan01" };
const SKIP_TNC_IDS = new Set(["cam-johnson", "jimmy-butler-iii"]);

export function matchPlayer(player: Pick<TncPlayer, "name" | "stations">, info: PlayerInfo): {
  bbrefId?: string; kandidaten: string[];
} {
  const name = normalizeName(player.name);
  const names = [...info].filter(([, other]) => normalizeName(other.name) === name);
  const first = Math.min(...player.stations.map(station => station.from + 1));
  const last = Math.max(...player.stations.map(station => station.to === null ? 2027 : station.to + 1));
  const matches = names.filter(([, other]) => first <= other.last + 1 && last >= other.first - 1);
  if (matches.length === 1) return { bbrefId: matches[0][0], kandidaten: [matches[0][0]] };
  if (names.length === 0 && reviewNameHints[name]) {
    return { kandidaten: [...info].filter(([, other]) => normalizeName(other.name) === reviewNameHints[name]
      && first <= other.last + 1 && last >= other.first - 1).map(([id]) => id).sort() };
  }
  return { kandidaten: (matches.length ? matches : names).map(([id]) => id).sort() };
}

export function fillMissingZero(line: SeasonLine): SeasonLine {
  return Object.fromEntries(Object.entries(line).map(([key, value]) => [key, value ?? 0])) as unknown as SeasonLine;
}

export function leagueForRating(league: LeagueAvg): LeagueAvg {
  // 1955 fehlt die Liga-Freiwurfquote; Treffer und Versuche sind jedoch erfasst.
  return league.ftPct === 0 && league.ftm !== null && league.fta !== null && league.fta > 0
    ? { ...league, ftPct: league.ftm / league.fta } : league;
}

const preferred = (player: PoolCandidate) => player.group === "allstar"
  || (player.tncTier !== null && player.tncTier <= 2);
const byStrength = (a: PoolCandidate, b: PoolCandidate) => b.strength - a.strength || a.id.localeCompare(b.id);

export function selectPool(players: PoolCandidate[], { target = 280, minG = 100, minC = 60 } = {}): void {
  const order = [...players].sort(byStrength);
  const mandatory = order.filter(preferred);
  if (mandatory.length > target || players.length < target) throw new Error("Pool-Größe mit Pflichtspielern nicht erreichbar.");
  for (const player of players) {
    player.selected = preferred(player);
    player.grund = player.group === "allstar" ? "TNC-Gruppe Allstar"
      : preferred(player) ? `TNC-Tier ${player.tncTier}` : "Außerhalb des Vorschlags nach vorläufiger Stärke";
  }
  for (const player of order.filter(player => !player.selected).slice(0, target - mandatory.length)) {
    player.selected = true; player.grund = "Nach vorläufiger Stärke aufgefüllt";
  }
  const count = (pos: Pos) => players.filter(player => player.selected && player.positions.includes(pos)).length;
  const quotas = { G: minG, C: minC } as const;
  for (const pos of ["C", "G"] as const) {
    while (count(pos) < quotas[pos]) {
      const incoming = order.find(player => !player.selected && player.positions.includes(pos));
      const outgoing = [...order].reverse().find(player => player.selected && !preferred(player)
        && !player.positions.includes(pos)
        && (["C", "G"] as const).every(other =>
          count(other) - Number(player.positions.includes(other)) + Number(incoming?.positions.includes(other))
            >= Math.min(count(other), quotas[other])));
      if (!incoming || !outgoing) throw new Error(`${pos}-Quote nicht erreichbar, ohne Pflichtspieler zu entfernen.`);
      outgoing.selected = false; outgoing.grund = `Für die ${pos}-Quote aus dem Vorschlag genommen`;
      incoming.selected = true; incoming.grund = `${pos}-Quote: nach vorläufiger Stärke ergänzt`;
    }
  }
}

// Bewusst bekannte Rollenspieler, Defensivspezialisten und Center; nur eindeutige Quellen-Treffer verwenden.
const additionNames = [
  "Robert Horry", "Tony Allen", "Bruce Bowen", "Shane Battier", "Derek Fisher",
  "Rick Fox", "Brian Shaw", "Ron Harper", "Luc Longley", "Bill Cartwright",
  "John Paxson", "Steve Kerr", "Kurt Rambis", "Dennis Johnson", "Michael Cooper",
  "A.C. Green", "Horace Grant", "Mario Elie", "Sam Cassell", "Kenny Smith",
  "Vernon Maxwell", "Otis Thorpe", "Chuck Hayes", "Tayshaun Prince", "Richard Hamilton",
  "Rasheed Wallace", "Mehmet Okur", "Antonio McDyess", "Ben Gordon", "Kirk Hinrich",
  "Raja Bell", "Boris Diaw", "Leandro Barbosa", "Mickael Pietrus", "Andris Biedrins",
  "Jason Kapono", "Matt Bonner", "Rasho Nesterovic", "Fabricio Oberto", "Tiago Splitter",
  "Nazr Mohammed", "Joel Anthony", "Udonis Haslem", "Joel Przybilla", "Theo Ratliff",
  "Samuel Dalembert", "Erick Dampier", "Brendan Haywood", "DeSagana Diop", "Jeff Foster",
  "Scot Pollard", "Greg Ostertag", "Mark Eaton", "Tree Rollins", "Mark West",
  "Kevin Willis", "Dale Davis", "Antonio Davis", "Elden Campbell", "Kendrick Perkins",
];

export function buildProposal(tncPath = "C:/Users/trill/Desktop/hoopjourney/src/data/players.json") {
  const tnc: TncPlayer[] = JSON.parse(readFileSync(tncPath, "utf8"));
  const sources = loadSources();
  const kandidaten: PoolCandidate[] = [];
  const ungeklaert: { id: string; name: string; kandidaten: string[] }[] = [];
  for (const player of tnc) {
    if (SKIP_TNC_IDS.has(player.id)) continue;
    const match = MANUAL_IDS[player.id] ? { bbrefId: MANUAL_IDS[player.id], kandidaten: [MANUAL_IDS[player.id]] }
      : matchPlayer(player, sources.playerInfo);
    if (!match.bbrefId || !sources.seasonsByPlayer.has(match.bbrefId)) {
      ungeklaert.push({ id: player.id, name: player.name, kandidaten: match.kandidaten });
      continue;
    }
    const positions = player.position.split("-") as Pos[];
    if (!positions.length || positions.some(pos => !["G", "F", "C"].includes(pos))) {
      throw new Error(`Unbekannte TNC-Position für ${player.name}: ${player.position}`);
    }
    kandidaten.push({ id: player.id, name: player.name, bbrefId: match.bbrefId,
      positions: [...new Set(positions)], group: player.group, tncTier: player.tier,
      strength: 0, peak: { from: 0, to: 0 }, selected: false, grund: "" });
  }
  // Doppelte TNC-Identitäten bleiben zur Prüfung offen und zählen nicht doppelt im Pool.
  const duplicates = new Set(kandidaten.filter((player, index) =>
    kandidaten.some((other, otherIndex) => otherIndex !== index && other.bbrefId === player.bbrefId)).map(player => player.bbrefId));
  const resolved = kandidaten.filter(player => {
    if (!duplicates.has(player.bbrefId)) return true;
    ungeklaert.push({ id: player.id, name: player.name, kandidaten: [player.bbrefId] });
    return false;
  });
  const tncNames = new Set(tnc.map(player => normalizeName(player.name)));
  const tncIds = new Set(kandidaten.map(player => player.bbrefId));
  const positionsByPlayer = new Map<string, Set<Pos>>();
  for (const row of parseCsv(readFileSync("data/source/Player Per Game.csv", "utf8"))) {
    if (row.lg !== "NBA" && row.lg !== "BAA") continue;
    const positions = positionsByPlayer.get(row.player_id) ?? new Set<Pos>();
    for (const part of row.pos.split(/[-/]/)) {
      const pos = ({ PG: "G", SG: "G", SF: "F", PF: "F", C: "C" } as const)[part as "PG" | "SG" | "SF" | "PF" | "C"];
      if (pos) positions.add(pos);
    }
    positionsByPlayer.set(row.player_id, positions);
  }
  const ergaenzungen: PoolCandidate[] = [];
  for (const name of additionNames) {
    if (tncNames.has(normalizeName(name))) continue;
    const matches = [...sources.playerInfo].filter(([, info]) => normalizeName(info.name) === normalizeName(name));
    if (matches.length !== 1) continue;
    const [bbrefId, info] = matches[0];
    if (tncIds.has(bbrefId) || !sources.seasonsByPlayer.has(bbrefId)) continue;
    const positions = (["G", "F", "C"] as const).filter(pos => positionsByPlayer.get(bbrefId)?.has(pos));
    if (!positions.length) continue;
    ergaenzungen.push({ id: normalizeName(name).replace(/[^a-z0-9]+/g, "-"), name: info.name,
      bbrefId, positions, group: "ergaenzung", tncTier: null, strength: 0,
      peak: { from: 0, to: 0 }, selected: false,
      grund: "Bekannter Rollenspieler, Defensivspezialist oder Center außerhalb von TNC; optional" });
    if (ergaenzungen.length === 30) break;
  }
  if (ergaenzungen.length !== 30) throw new Error(`Nur ${ergaenzungen.length} sichere Ergänzungen gefunden.`);
  const all = [...resolved, ...ergaenzungen];
  const peaks = all.map(player => {
    const lines = sources.seasonsByPlayer.get(player.bbrefId)!;
    const raws = lines.map(line => {
      const league = sources.league.get(line.season);
      if (!league) throw new Error(`Liga-Durchschnitt fehlt: ${line.season}`);
      const raw = seasonRaw(fillMissingZero(line), leagueForRating(league));
      if (Object.values(raw).some(value => !Number.isFinite(value))) throw new Error(`Ungültige Rohwerte: ${player.name}, ${line.season}`);
      return raw;
    });
    return pickPeak(lines, raws);
  });
  const reference = peaks.slice(0, resolved.length).map(peak => peak.raw);
  const strengths = strengthsFromRaw(reference);
  all.forEach((player, index) => {
    // Ergänzungen einzeln gegen dieselbe TNC-Bezugsgruppe bewerten, ohne deren Ränge zu ändern.
    player.strength = index < resolved.length ? strengths[index]
      : strengthsFromRaw([...reference, peaks[index].raw]).at(-1)!;
    player.peak = { from: peaks[index].from, to: peaks[index].to };
  });
  selectPool(resolved);
  for (const player of all) {
    if (sources.seasonsByPlayer.get(player.bbrefId)!.some(line =>
      line.season >= player.peak.from && line.season <= player.peak.to && line.x2p === null)) {
      player.grund += "; historische Zweierwerte fehlen: vorläufig 0";
    }
  }
  return { kandidaten: resolved.sort(byStrength), ergaenzungen, ungeklaert: ungeklaert.sort((a, b) => a.id.localeCompare(b.id)) };
}

export function main() {
  const proposal = buildProposal();
  mkdirSync(".superpowers", { recursive: true });
  writeFileSync(".superpowers/pool-vorschlag.json", `${JSON.stringify(proposal, null, 2)}\n`, "utf8");
  const selected = proposal.kandidaten.filter(player => player.selected);
  console.log(`TNC zugeordnet: ${proposal.kandidaten.length}; Ergänzungen: ${proposal.ergaenzungen.length}`);
  console.log(`Ausgewählt: ${selected.length}; G: ${selected.filter(p => p.positions.includes("G")).length}; F: ${selected.filter(p => p.positions.includes("F")).length}; C: ${selected.filter(p => p.positions.includes("C")).length}`);
  console.log(`Ungeklärt: ${proposal.ungeklaert.length}`);
  for (const player of proposal.ungeklaert) console.log(`  ${player.id} (${player.name}): ${player.kandidaten.join(", ") || "kein namensgleicher Kandidat"}`);
}

// Nur ausführen, wenn dieses Skript direkt gestartet wurde (nicht beim Import, nicht unter Vitest).
if (!process.env.VITEST && process.argv.some((arg) => arg.replace(/\\/g, "/").endsWith("pool-candidates.ts"))) main();