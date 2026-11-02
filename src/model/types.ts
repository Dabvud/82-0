export type Pos = "G" | "F" | "C";

export interface SeasonLine {
  season: number;
  g: number;
  x2p: number;
  x2pPct: number;
  x3p: number | null;
  x3pPct: number | null;
  ftm: number;
  fta: number;
  ftPct: number;
  ast: number;
  tov: number | null;
  orb: number | null;
  drb: number | null;
  trb: number;
  stl: number | null;
  blk: number | null;
  allDef1: boolean;
  allDef2: boolean;
}

// Liga-Durchschnitte pro Team und Spiel.
export type LeagueAvg = Omit<SeasonLine, "season" | "g" | "allDef1" | "allDef2">;

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
