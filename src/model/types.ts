export type Pos = "G" | "F" | "C";

export interface SeasonLine {
  season: number;
  g: number;
  mp?: number | null;
  x2p: number | null;
  x2pPct: number;
  x3p: number | null;
  x3pPct: number | null;
  ftm: number | null;
  fta: number | null;
  ftPct: number;
  ast: number | null;
  tov: number | null;
  orb: number | null;
  drb: number | null;
  trb: number | null;
  stl: number | null;
  blk: number | null;
  allDef1: boolean;
  allDef2: boolean;
}

// Liga-Durchschnitte pro Team und Spiel.
export type LeagueAvg = Omit<SeasonLine, "season" | "g" | "mp" | "allDef1" | "allDef2">;

export interface RawCats {
  shooter: number;
  finisher: number;
  playmaking: number;
  oreb: number;
  dreb: number;
  stl: number;
  blk: number;
  allDef: number;
}

export interface Categories {
  shooter: number;
  finisher: number;
  playmaking: number;
  rebound: number;
  defense: number;
  oreb: number;
  dreb: number;
  blk: number;
}
