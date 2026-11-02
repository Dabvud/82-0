import type { GameData, Settings } from "../app-data";
import { formatMoney } from "../format";
import { assignSlots } from "../game/slots";
import { teamRating } from "../game/team";
import type { Player, Pos } from "../game/types";

interface Props {
  lineup: Player[];
  data: GameData;
  settings: Settings;
  onStart: () => void;
}

const ORDER: Pos[] = ["G", "F", "C"];

export function SquadScreen({ lineup, data, settings, onStart }: Props) {
  const slots = assignSlots(lineup) ?? {};
  const sorted = [...lineup].sort((a, b) => ORDER.indexOf(slots[a.id]) - ORDER.indexOf(slots[b.id]));
  const total = lineup.reduce((sum, p) => sum + p.price, 0);
  const { notes } = teamRating(lineup);
  const taxed = total > data.luxuryLine;
  return (
    <>
      <h2>Deine Starting Five</h2>
      <ul className="lineup">
        {sorted.map((p) => (
          <li key={p.id} className="lineup__row">
            <span className="lineup__pos">{slots[p.id]}</span>
            <span className="lineup__name">{p.name}</span>
            <span className="lineup__price">{formatMoney(p.price)}</span>
          </li>
        ))}
      </ul>
      <p className="muted">
        Gehälter zusammen: {formatMoney(total)} von {formatMoney(data.budget)}.
        {taxed && settings.bankruptcy && " Du liegst über der Luxussteuergrenze: 10 % Pleiterisiko."}
      </p>
      {notes.length > 0 && (
        <ul className="notes" aria-label="Wie dein Team zusammenpasst">
          {notes.map((n) => <li key={n.text}>{n.text}</li>)}
        </ul>
      )}
      <button type="button" className="btn btn--main" onClick={onStart}>Saison starten</button>
    </>
  );
}
