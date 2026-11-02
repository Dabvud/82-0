import type { GameData, Settings } from "../app-data";
import { formatMoney } from "../format";
import { SlotBar } from "../components/SlotBar";
import { SLOT_POSITIONS } from "../game/draft";
import { teamRating } from "../game/team";
import type { Player } from "../game/types";

interface Props {
  lineup: Player[];
  slots: (string | null)[];
  onMove: (from: number, to: number) => void;
  data: GameData;
  settings: Settings;
  onStart: () => void;
}


export function SquadScreen({ lineup, slots, data, settings, onStart, onMove }: Props) {
  // Reihenfolge und Position kommen aus der eigenen Aufstellung (G, G, F, F, C).
  const sorted = slots.map((id) => lineup.find((p) => p.id === id)).filter((p): p is Player => Boolean(p));
  const posOf = (p: Player) => SLOT_POSITIONS[slots.indexOf(p.id)];
  const total = lineup.reduce((sum, p) => sum + p.price, 0);
  const { notes } = teamRating(lineup);
  const taxed = total > data.luxuryLine;
  return (
    <>
      <h2>Deine Starting Five</h2>
      <SlotBar picks={lineup} slots={slots} onMove={onMove} />
      <p className="muted">Umstellen: Spieler ziehen oder antippen und dann den Zielplatz antippen.</p>
      <ul className="lineup">
        {sorted.map((p) => (
          <li key={p.id} className="lineup__row">
            <span className="lineup__pos">{posOf(p)}</span>
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
