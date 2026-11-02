import { CONFIG } from "../config";
import type { NbaTeam, Player } from "../game/types";
import salaryCap from "../../data/manual/salary-cap.json";
import players from "./players.json";
import teams from "./teams.json";

export const PLAYERS: Player[] = players as Player[];
export const TEAMS: NbaTeam[] = teams;
export const CAP_NOW = salaryCap.caps["2027"];
export const BUDGET = CAP_NOW * CONFIG.budgetPct;
export const LUXURY_LINE = CAP_NOW * CONFIG.luxuryPct;
export const MIN_PRICE = Math.min(...PLAYERS.map(player => player.price));
