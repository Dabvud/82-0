import { useState } from "react";
import type { GameData, Settings } from "../app-data";
import { BudgetBar } from "../components/BudgetBar";
import { PlayerCard } from "../components/PlayerCard";
import { SlotBar } from "../components/SlotBar";
import { formatMoney } from "../format";
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
const LOCKED_REASON = "Danach reicht das Budget nicht mehr für die restlichen Plätze";
const millions = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Kurzname für die Kachel: „A. Davis“ – Initiale gegen gleiche Nachnamen, Zusätze wie „Jr.“ bleiben weg. */
function shortName(name: string): string {
  const parts = name.split(/\s+/).filter((part) => !/^(Jr\.?|Sr\.?|II|III|IV)$/i.test(part));
  return parts.length > 1 ? `${parts[0][0]}. ${parts.slice(1).join(" ")}` : name;
}

export function DraftScreen({ session, data, settings, onPick, onExit }: Props) {
  const [open, setOpen] = useState<Player | null>(null);
  const { picks, offers } = session.draft;
  const spent = picks.reduce((sum, p) => sum + p.price, 0);
  const affordable = (p: Player) => isAffordable(p, picks, data.pool, data.budget);

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

      <div className="matrix" role="table" aria-label="Angebote dieser Runde">
        {TIERS.map((tier) => (
          <div key={tier} className="matrix__row" role="row">
            <span className="matrix__tier" role="rowheader">T{tier}</span>
            {offers[tier].map((p) => {
              const ok = affordable(p);
              return (
                <span key={p.id} role="cell" className="matrix__cell">
                  <button type="button" className={ok ? "tile" : "tile tile--locked"} onClick={() => setOpen(p)}
                    aria-label={`${p.name}, ${p.positions.join("/")}, ${formatMoney(p.price)}${ok ? "" : ", zu teuer"}`}>
                    <span className="tile__name">{shortName(p.name)}</span>
                    <span className="tile__pos">{p.positions.join("/")}</span>
                    <span className="tile__price">{millions.format(p.price / 1_000_000)}</span>
                  </button>
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <p className="muted matrix__hint">Preise in Mio. $. Tippe auf einen Spieler für Details.</p>

      {open && (
        <div className="sheet-backdrop" onClick={() => setOpen(null)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label={open.name} onClick={(e) => e.stopPropagation()}>
            <PlayerCard player={open} disabledReason={affordable(open) ? undefined : LOCKED_REASON}
              onPick={(p) => { setOpen(null); onPick(p); }} />
            <button type="button" className="btn btn--quiet" onClick={() => setOpen(null)}>Schließen</button>
          </div>
        </div>
      )}
    </>
  );
}
