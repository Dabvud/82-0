import { useState } from "react";
import type { GameData, Settings } from "../app-data";
import { BudgetBar } from "../components/BudgetBar";
import { PlayerCard } from "../components/PlayerCard";
import { SlotBar } from "../components/SlotBar";
import { useSlotDrag } from "../components/useSlotDrag";
import { formatMoney } from "../format";
import { isAffordable, SLOT_POSITIONS } from "../game/draft";
import { canAdd } from "../game/slots";
import type { Session } from "../game/session";
import type { Player, Tier } from "../game/types";

interface Props {
  session: Session;
  data: GameData;
  settings: Settings;
  /** slot: gewünschter Platz (0–4) beim Ziehen, sonst automatisch. */
  onPick: (player: Player, slot?: number) => void;
  onExit: () => void;
  onRefresh: () => void;
  onMove?: (from: number, to: number) => void;
}

const TIERS: Tier[] = [1, 2, 3, 4, 5];
const LOCKED_REASON = "Danach reicht das Budget nicht mehr für die restlichen Plätze";
const NO_SLOT_REASON = "Für diese Position ist kein Platz mehr frei";
const millions = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Kurzname für die Kachel: „A. Davis“ – Initiale gegen gleiche Nachnamen, Zusätze wie „Jr.“ bleiben weg. */
function shortName(name: string): string {
  const parts = name.split(/\s+/).filter((part) => !/^(Jr\.?|Sr\.?|II|III|IV)$/i.test(part));
  return parts.length > 1 ? `${parts[0][0]}. ${parts.slice(1).join(" ")}` : name;
}

export function DraftScreen({ session, data, settings, onPick, onExit, onRefresh, onMove }: Props) {
  const [open, setOpen] = useState<Player | null>(null);
  const { picks, offers } = session.draft;
  const spent = picks.reduce((sum, p) => sum + p.price, 0);
  // Grund, warum eine Kachel gerade nicht wählbar ist (undefined = wählbar).
  const blocker = (p: Player) => !canAdd(picks, p) ? NO_SLOT_REASON
    : isAffordable(p, picks, data.pool, data.budget) ? undefined : LOCKED_REASON;
  // Kachel auf einen Platz ziehen: nur wenn wählbar, der Platz frei ist und die Position passt.
  const drag = useSlotDrag<Player>((p, slot) => {
    if (blocker(p) || session.draft.slots[slot] !== null || !p.positions.includes(SLOT_POSITIONS[slot])) return;
    onPick(p, slot);
  });

  return (
    <>
      <div className="draft-head">
        <div className="topbar">
          <h2>Pick {picks.length + 1} von 5</h2>
          <button type="button" className="iconbtn" onClick={onExit} aria-label="Zum Start">✕</button>
        </div>
        <BudgetBar spent={spent} budget={data.budget} luxuryLine={data.luxuryLine} bankruptcyOn={settings.bankruptcy} />
        <SlotBar picks={picks} slots={session.draft.slots} onMove={onMove ?? (() => {})} />
      </div>

      <div className="matrix" role="table" aria-label="Angebote dieser Runde">
        {TIERS.map((tier) => (
          <div key={tier} className="matrix__row" role="row">
            <span className="matrix__tier" role="rowheader">T{tier}</span>
            {offers[tier].map((p) => {
              const reason = blocker(p);
              const ok = !reason;
              return (
                <span key={p.id} role="cell" className="matrix__cell">
                  <button type="button" className={ok ? "tile" : "tile tile--locked"} onClick={() => { if (!drag.consumeClick()) setOpen(p); }}
                    onPointerDown={(e) => drag.start(e, p, shortName(p.name))}
                    aria-label={`${p.name}, ${p.positions.join("/")}, ${formatMoney(p.price)}${ok ? "" : reason === NO_SLOT_REASON ? ", kein freier Platz" : ", zu teuer"}`}>
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
      <button type="button" className="btn btn--quiet btn--small" disabled={session.draft.refreshedAt !== null} onClick={onRefresh}>
        {session.draft.refreshedAt === null ? "Matrix neu ziehen (1× pro Run)" : "Schon neu gezogen"}
      </button>

      {drag.ghost}
      {open && (
        <div className="sheet-backdrop" onClick={() => setOpen(null)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label={open.name} onClick={(e) => e.stopPropagation()}>
            <PlayerCard player={open} disabledReason={blocker(open)}
              onPick={(p) => { setOpen(null); onPick(p); }} />
            <button type="button" className="btn btn--quiet" onClick={() => setOpen(null)}>Schließen</button>
          </div>
        </div>
      )}
    </>
  );
}
