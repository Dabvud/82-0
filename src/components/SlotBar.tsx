import { useState } from "react";
import { SLOT_POSITIONS } from "../game/draft";
import { assignSlots } from "../game/slots";
import type { Player } from "../game/types";
import { useSlotDrag } from "./useSlotDrag";

const SLOT_NAMES = { G: "Guard", F: "Forward", C: "Center" } as const;

interface Props {
  picks: Player[];
  /** Spieler-ID je Platz (G, G, F, F, C); ohne Angabe wird automatisch verteilt. */
  slots?: (string | null)[];
  /** Ohne onMove ist die Leiste nur Anzeige. */
  onMove?: (from: number, to: number) => void;
}

function autoSlots(picks: Player[]): (string | null)[] {
  const assignment = assignSlots(picks) ?? {};
  const result: (string | null)[] = SLOT_POSITIONS.map(() => null);
  for (const p of picks) {
    const index = SLOT_POSITIONS.findIndex((pos, i) => pos === assignment[p.id] && result[i] === null);
    if (index >= 0) result[index] = p.id;
  }
  return result;
}

export function SlotBar({ picks, slots, onMove }: Props) {
  const layout = slots ?? autoSlots(picks);
  const [selected, setSelected] = useState<number | null>(null);
  const drag = useSlotDrag<number>((from, to) => { if (from !== to && canMove(from, to)) onMove?.(from, to); });
  const playerAt = (i: number) => picks.find((p) => p.id === layout[i]) ?? null;
  function canMove(from: number, to: number): boolean {
    const moving = playerAt(from);
    const other = playerAt(to);
    return Boolean(moving && moving.positions.includes(SLOT_POSITIONS[to])
      && (!other || other.positions.includes(SLOT_POSITIONS[from])));
  }
  function tap(i: number) {
    if (drag.consumeClick()) return;
    if (selected === null) { if (playerAt(i)) setSelected(i); return; }
    if (selected !== i && canMove(selected, i)) onMove?.(selected, i);
    setSelected(null);
  }

  return (
    <>
    <ol className="slots" aria-label="Deine Starting Five">
      {SLOT_POSITIONS.map((pos, i) => {
        const player = playerAt(i);
        const content = (
          <>
            <span className="slot__pos">{pos}</span>
            <span className="slot__name">{player ? player.name : "frei"}</span>
          </>
        );
        return (
          <li key={i} className={player ? "slot slot--filled" : "slot"} data-pos={pos} title={SLOT_NAMES[pos]}>
            {onMove ? (
              <button type="button" className={selected === i ? "slot__btn slot__btn--picked" : "slot__btn"} data-slot={i}
                aria-label={`${pos}: ${player ? player.name : "frei"}`} aria-pressed={selected === i}
                disabled={selected !== null && selected !== i && !canMove(selected, i)}
                onClick={() => tap(i)}
                onPointerDown={(e) => { if (player) drag.start(e, i, player.name); }}>
                {content}
              </button>
            ) : <span className="slot__btn" data-slot={i}>{content}</span>}
          </li>
        );
      })}
    </ol>
    {drag.ghost}
    </>
  );
}
