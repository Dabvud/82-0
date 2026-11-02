import { useState } from "react";
import { formatMoney } from "../format";
import { tradeOffers } from "../game/trade";
import type { Player, TradeDecision } from "../game/types";

interface Props {
  lineup: Player[];
  pool: Player[];
  budget: number;
  seedKey: string;
  wins: number;
  losses: number;
  onDecide: (decision: TradeDecision) => void;
}

export function DeadlineSheet({ lineup, pool, budget, seedKey, wins, losses, onDecide }: Props) {
  const [out, setOut] = useState<Player | null>(null);
  const offers = out ? tradeOffers(lineup, out, pool, budget, seedKey) : [];

  return (
    <div className="sheet-backdrop">
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="deadline-title">
        <h2 id="deadline-title">Trade Deadline</h2>
        <p>Stand {wins}-{losses}. {out ? `Wer soll für ${out.name} kommen?` : "Willst du nachbessern?"}</p>

        {!out && (
          <div className="stack">
            {lineup.map((player) => (
              <button key={player.id} type="button" className="choice" onClick={() => setOut(player)}
                aria-label={`${player.name} abgeben`}>
                <span className="choice__name">{player.name}</span>
                <span className="choice__price">{formatMoney(player.price)}</span>
              </button>
            ))}
            <button type="button" className="btn btn--quiet" onClick={() => onDecide(null)}>Kein Trade</button>
          </div>
        )}

        {out && offers.length > 0 && (
          <div className="stack">
            {offers.map((offer) => (
              <button key={offer.player.id} type="button" className="choice" onClick={() => onDecide({ outId: out.id, offer })}>
                <span className="choice__name">{offer.player.name}</span>
                <span className="choice__price">{formatMoney(offer.player.price)}</span>
                <span className="choice__note">{offer.player.positions.join("/")}, Peak {offer.player.peak.from}–{offer.player.peak.to}</span>
                {offer.injured && <span className="choice__note choice__note--injury">🚑 verletzt, Ausfall ungewiss</span>}
              </button>
            ))}
          </div>
        )}

        {out && offers.length === 0 && (
          <div className="stack">
            <p>Keine Trade-Partner gefunden.</p>
            <button type="button" className="btn btn--main" onClick={() => onDecide(null)}>Weiter ohne Trade</button>
          </div>
        )}
      </div>
    </div>
  );
}
