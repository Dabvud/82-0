import { formatMoney } from "../format";
import type { Player } from "../game/types";
import { CategoryBars } from "./CategoryBars";

interface Props {
  player: Player;
  onPick: (player: Player) => void;
  disabledReason?: string;
}

export function PlayerCard({ player, onPick, disabledReason }: Props) {
  const peak = player.peak.from === player.peak.to ? `Peak ${player.peak.from}` : `Peak ${player.peak.from}–${player.peak.to}`;
  return (
    <article className={disabledReason ? "card card--locked" : "card"}>
      <header className="card__head">
        <div>
          <h3 className="card__name">{player.name}</h3>
          <p className="card__meta"><span className="card__pos">{player.positions.join("/")}</span> <span>{peak}</span></p>
        </div>
        <p className="card__price">{formatMoney(player.price)}</p>
      </header>
      <CategoryBars cats={player.cats} />
      {disabledReason && <p className="card__reason">{disabledReason}</p>}
      <button type="button" className="card__pick" disabled={Boolean(disabledReason)} onClick={() => onPick(player)}
        aria-label={`${player.name} verpflichten`}>
        Verpflichten
      </button>
    </article>
  );
}
