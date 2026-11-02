import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { LeagueAvg, SeasonLine } from "../../src/model/types";

export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const input = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '"') {
      if (quoted && input[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field); field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && input[i + 1] === "\n") i++;
      row.push(field);
      if (row.some(value => value !== "")) rows.push(row);
      row = []; field = "";
    } else field += char;
  }
  if (quoted) throw new Error("CSV: Anführungszeichen nicht geschlossen.");
  row.push(field);
  if (row.some(value => value !== "")) rows.push(row);
  const header = rows.shift() ?? [];
  return rows.map(values => Object.fromEntries(header.map((key, index) => [key, values[index] ?? ""])));
}

const nba = (row: Record<string, string>) => row.lg === "NBA" || row.lg === "BAA";
const number = (value: string | undefined): number | null => {
  if (value === undefined || value.trim() === "" || value === "NA") return null;
  const result = Number(value);
  if (!Number.isFinite(result)) throw new Error(`Ungültige Zahl in CSV: ${value}`);
  return result;
};

function statistics(row: Record<string, string>): LeagueAvg {
  return {
    x2p: number(row.x2p_per_game), x2pPct: number(row.x2p_percent) ?? 0,
    x3p: number(row.x3p_per_game), x3pPct: number(row.x3p_percent),
    ftm: number(row.ft_per_game), fta: number(row.fta_per_game), ftPct: number(row.ft_percent) ?? 0,
    ast: number(row.ast_per_game), tov: number(row.tov_per_game),
    orb: number(row.orb_per_game), drb: number(row.drb_per_game), trb: number(row.trb_per_game),
    stl: number(row.stl_per_game), blk: number(row.blk_per_game),
  };
}

export function loadSources(dir = "data/source"): {
  seasonsByPlayer: Map<string, SeasonLine[]>;
  league: Map<number, LeagueAvg>;
  playerInfo: Map<string, { name: string; first: number; last: number }>;
} {
  const read = (name: string) => parseCsv(readFileSync(join(dir, `${name}.csv`), "utf8")).filter(nba);
  const defense = new Map<string, Set<string>>();
  for (const row of read("End of Season Teams")) {
    if (row.type !== "All-Defense") continue;
    const key = `${row.player_id}:${row.season}`;
    const awards = defense.get(key) ?? new Set<string>();
    awards.add(row.number_tm);
    defense.set(key, awards);
  }
  const best = new Map<string, Record<string, string>>();
  const combined = (team: string) => team === "TOT" || /^\d+TM$/.test(team);
  for (const row of read("Player Per Game")) {
    const key = `${row.player_id}:${row.season}`;
    const previous = best.get(key);
    if (!previous || Number(row.g) > Number(previous.g)
      || (row.g === previous.g && combined(row.team) && !combined(previous.team))) best.set(key, row);
  }
  const seasonsByPlayer = new Map<string, SeasonLine[]>();
  for (const row of best.values()) {
    const awards = defense.get(`${row.player_id}:${row.season}`);
    const lines = seasonsByPlayer.get(row.player_id) ?? [];
    lines.push({ season: Number(row.season), g: Number(row.g), mp: number(row.mp_per_game), ...statistics(row),
      allDef1: awards?.has("1st") ?? false, allDef2: awards?.has("2nd") ?? false });
    seasonsByPlayer.set(row.player_id, lines);
  }
  for (const lines of seasonsByPlayer.values()) lines.sort((a, b) => a.season - b.season);

  const league = new Map<number, LeagueAvg>();
  for (const row of read("Team Stats Per Game")) {
    if (row.team === "League Average") league.set(Number(row.season), statistics(row));
  }
  const years = [...league.keys()].sort((a, b) => a - b);
  for (const key of ["stl", "blk", "orb", "drb", "tov"] as const) {
    const first = years.find(year => league.get(year)![key] !== null);
    if (first === undefined) throw new Error(`Kein Liga-Durchschnitt für ${key} vorhanden.`);
    // Nur die historischen Lücken vor der ersten erfassten Saison auffüllen.
    for (const year of years) {
      if (year < first && league.get(year)![key] === null) league.get(year)![key] = league.get(first)![key];
    }
  }
  const playerInfo = new Map<string, { name: string; first: number; last: number }>();
  for (const row of read("Player Season Info")) {
    const season = Number(row.season);
    const previous = playerInfo.get(row.player_id);
    playerInfo.set(row.player_id, { name: row.player,
      first: Math.min(previous?.first ?? season, season), last: Math.max(previous?.last ?? season, season) });
  }
  return { seasonsByPlayer, league, playerInfo };
}
