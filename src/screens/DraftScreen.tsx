import { useState } from "react";
import type { GameData, Settings } from "../app-data";
import { BudgetBar } from "../components/BudgetBar";
import { PlayerCard } from "../components/PlayerCard";
import { SlotBar } from "../components/SlotBar";
import { isAffordable } from "../game/draft";
import type { Session } from "../game/session";
import type { Player, Tier } from "../game/types";

interface Props {
  session: Session;
  data: GameData;
  settings: Settings;
  onPick: (player: Player) => void;
  onExit: () => void;
}

const TIERS: Tier[] = [1, 2, 3, 4, 5];
const TIER_HINT: Record<Tier, string> = {
  1: "Die Besten der Besten",
  2: "Stars",
  3: "Starke Starter",
  4: "Solide Rollenspieler",
  5: "Ergänzungsspieler",
};

export function DraftScreen({ session, data, settings, onPick, onExit }: Props) {
  const [tier, setTier] = useState<Tier>(1);
  const { picks, offers } = session.draft;
  const spent = picks.reduce((sum, p) => sum + p.price, 0);
  const cards = offers[tier];

  return (
    <>
      <div className="draft-head">
        <div className="topbar">
          <h2>Pick {picks.length + 1} von 5</h2>
          <button type="button" className="iconbtn" onClick={onExit} aria-label="Zum Start">✕</button>
        </div>
        <BudgetBar spent={spent} budget={data.budget} luxuryLine={data.luxuryLine} bankruptcyOn={settings.bankruptcy} />
        <SlotBar picks={picks} />
      </div>

      <div className="tiers" role="tablist" aria-label="Tiers">
        {TIERS.map((t) => (
          <button key={t} type="button" role="tab" id={`tab-${t}`} aria-controls="tier-panel"
            aria-selected={t === tier} className="tiers__tab" onClick={() => setTier(t)}>
            T{t}
          </button>
        ))}
      </div>
      <p className="tiers__hint">{TIER_HINT[tier]}</p>

      <div className="cards" role="tabpanel" id="tier-panel" aria-labelledby={`tab-${tier}`}>
        {cards.length === 0 && <p className="muted">In diesem Tier passt gerade niemand auf deine freien Plätze.</p>}
        {cards.map((player) => (
          <PlayerCard key={player.id} player={player} onPick={onPick}
            disabledReason={isAffordable(player, picks, data.pool, data.budget)
              ? undefined : "Danach reicht das Budget nicht mehr für die restlichen Plätze"} />
        ))}
      </div>
    </>
  );
}
