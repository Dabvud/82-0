import type { NbaTeam, Player } from "./game/types";

/** Alles, was die Oberfläche an Spieldaten braucht – in Tests durch Fixtures ersetzbar. */
export interface GameData {
  pool: Player[];
  teams: NbaTeam[];
  budget: number;
  luxuryLine: number;
}

export interface Settings {
  deadline: boolean;
  bankruptcy: boolean;
}
