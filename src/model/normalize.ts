import { CONFIG } from "../config";
import type { LeagueAvg, RawCats, SeasonLine } from "./types";

export function seasonRaw(line: SeasonLine, lg: LeagueAvg): RawCats {
  const value = (field: keyof LeagueAvg, source: LeagueAvg = line): number => {
    const result = source[field];
    if (result === null) {
      const origin = source === lg ? " im Liga-Durchschnitt" : "";
      throw new Error(`Fehlender Wert für ${field}${origin} in Saison ${line.season}`);
    }
    return result;
  };
  const rel = (field: keyof LeagueAvg): number =>
    value(field) / (value(field, lg) / CONFIG.playersPerTeam);
  const e2 = line.x2pPct / lg.x2pPct;
  const eft = line.ftPct / lg.ftPct;
  // Ohne Dreier gibt es keine Quote (und vor 1979/80 keine Liga-Werte): Dreieranteil ist dann 0.
  const threes = line.x3p === 0 ? 0
    : rel("x3p") * (value("x3pPct") / value("x3pPct", lg)) ** CONFIG.effExponent;

  return {
    shooter: CONFIG.shooterWeights.threePoint * threes + CONFIG.shooterWeights.freeThrow * eft,
    finisher: (CONFIG.twoPointValue * line.x2p + line.ftm)
      / ((CONFIG.twoPointValue * lg.x2p + lg.ftm) / CONFIG.playersPerTeam)
      * e2 ** CONFIG.effExponent,
    playmaking: rel("ast") - CONFIG.turnoverPenalty * rel("tov"),
    oreb: rel("orb"),
    dreb: rel("drb"),
    stl: rel("stl"),
    blk: rel("blk"),
    allDef: line.allDef1 ? CONFIG.allDefBonus.first
      : line.allDef2 ? CONFIG.allDefBonus.second : 0,
  };
}
