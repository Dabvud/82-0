import { SegmentDisplay } from "./SegmentDisplay";

interface Props {
  wins: number;
  losses: number;
  caption?: string;
  small?: boolean;
}

/** Die Bilanz auf der Hallenanzeige: Siege in Bernstein, Niederlagen in Rot. */
export function Scoreboard({ wins, losses, caption, small = false }: Props) {
  return (
    <section className="board">
      <div className={small ? "board__screen score score--small" : "board__screen score"} role="img"
        aria-label={`Bilanz ${wins} Siege, ${losses} Niederlagen`}>
        <SegmentDisplay value={String(wins)} label={String(wins)} minDigits={2} decorative />
        <span className="score__dash" aria-hidden="true">–</span>
        <SegmentDisplay value={String(losses)} label={String(losses)} minDigits={2} className="segments--loss" decorative />
      </div>
      {caption && <p className="board__caption">{caption}</p>}
    </section>
  );
}
