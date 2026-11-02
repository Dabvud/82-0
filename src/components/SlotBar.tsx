import { assignSlots } from "../game/slots";
import type { Player, Pos } from "../game/types";

const SLOTS: Pos[] = ["G", "G", "F", "F", "C"];
const SLOT_NAMES: Record<Pos, string> = { G: "Guard", F: "Forward", C: "Center" };

export function SlotBar({ picks }: { picks: Player[] }) {
  const assignment = assignSlots(picks) ?? {};
  const remaining = [...picks];
  return (
    <ol className="slots" aria-label="Deine Starting Five">
      {SLOTS.map((pos, index) => {
        const at = remaining.findIndex((p) => assignment[p.id] === pos);
        const player = at >= 0 ? remaining.splice(at, 1)[0] : null;
        return (
          <li key={index} className={player ? "slot slot--filled" : "slot"} data-pos={pos} title={SLOT_NAMES[pos]}>
            <span className="slot__pos">{pos}</span>
            <span className="slot__name">{player ? player.name : "frei"}</span>
          </li>
        );
      })}
    </ol>
  );
}
