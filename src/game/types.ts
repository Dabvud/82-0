import type { Pos, Categories } from "../model/types";
export type { Pos, Categories };

export type Tier = 1 | 2 | 3 | 4 | 5;

export interface Player {
  id: string;
  name: string;
  positions: Pos[];
  peak: { from: number; to: number };
  cats: Categories;
  strength: number;
  tier: Tier;
  price: number;
  priceSource: "contract" | "tier";
  contract: { season: number; team: string } | null;
  value: number;
  overpaid: boolean;
  estimated: boolean;
}

export interface NbaTeam {
  abbr: string;
  name: string;
  net: number;
}

export interface TradeOffer {
  player: Player;
  injured: boolean;
}

export type TradeDecision = null | { outId: string; offer: TradeOffer };
