import { useEffect, useState } from "react";
import { Scoreboard } from "../components/Scoreboard";
import { msUntilNextPuzzle } from "../game/daily";
import { tierLabel } from "../game/season";
import type { SeasonLog } from "../game/season";
import { seasonStats } from "../game/season-stats";
import { shareText } from "../game/share";
import type { NbaTeam, Player } from "../game/types";
import { shareResult } from "../share";

interface Props {
  log: SeasonLog;
  lineup: Player[];
  /** Für die Namen der Teams, die dich geschlagen haben. */
  teams?: NbaTeam[];
  /** Rätselnummer im Tagesrätsel, sonst null. */
  puzzleNo: number | null;
  now: Date;
  onAgain: () => void;
  onHome: () => void;
}

function countdown(ms: number): string {
  const minutes = Math.ceil(ms / 60_000);
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")} Std.`;
}

const SHARE_STATUS = { shared: "Geteilt.", copied: "In die Zwischenablage kopiert.", cancelled: null, failed: "Teilen hat nicht geklappt." } as const;

export function ResultScreen({ log, lineup, teams = [], puzzleNo, now, onAgain, onHome }: Props) {
  const losses = log.games.filter((g) => !g.win);
  const teamName = (abbr: string) => teams.find((team) => team.abbr === abbr)?.name ?? abbr;
  const stats = teams.length ? seasonStats(log, lineup, teams) : null;
  const signed = (x: number) => (x >= 0 ? "+" : "−") + Math.abs(x).toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const rec = (r: { wins: number; losses: number }) => r.wins + "-" + r.losses;
  const num = (x: number) => x.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const text = shareText(puzzleNo, log, lineup);
  const [status, setStatus] = useState<string | null>(null);
  const [clock, setClock] = useState(now);
  useEffect(() => {
    if (puzzleNo === null) return;
    const id = setInterval(() => setClock(new Date()), 30_000);
    return () => clearInterval(id);
  }, [puzzleNo]);

  return (
    <>
      <Scoreboard wins={log.wins} losses={log.losses} />
      <p className="verdict">{tierLabel(log.wins)}</p>
      {stats && (
        <section className="dominance" aria-labelledby="dominance-title">
          <h3 id="dominance-title">So dominant war dein Team</h3>
          <dl className="statlist">
            <div><dt>Teamstärke (Net Rating)</dt><dd>{signed(stats.net)}</dd></div>
            <div className="dominance__note"><dt>Bestes NBA-Team 2025/26</dt><dd>{stats.bestTeam.name} {signed(stats.bestTeam.net)}</dd></div>
            <div><dt>Offensive</dt><dd>{signed(stats.off)}</dd></div>
            <div><dt>Defensive</dt><dd>{signed(stats.def)}</dd></div>
            <div><dt>Längste Siegesserie</dt><dd>{stats.longestStreak} Siege</dd></div>
            <div><dt>Gegen die Top 10</dt><dd>{rec(stats.vsTop10)}</dd></div>
          </dl>
          <h3>Deine Five pro Spiel (Peak-Saisons)</h3>
          <dl className="statlist statlist--grid">
            <div><dt>Punkte</dt><dd>{num(stats.box.pts)}</dd></div>
            <div><dt>Rebounds</dt><dd>{num(stats.box.reb)}</dd></div>
            <div><dt>Assists</dt><dd>{num(stats.box.ast)}</dd></div>
            <div><dt>Steals</dt><dd>{num(stats.box.stl)}</dd></div>
            <div><dt>Blocks</dt><dd>{num(stats.box.blk)}</dd></div>
            <div><dt>Dreier</dt><dd>{num(stats.box.fg3m)}</dd></div>
            <div><dt>Dreierquote</dt><dd>{(stats.box.fg3pct * 100).toLocaleString("de-DE", { maximumFractionDigits: 1 })} %</dd></div>
          </dl>
        </section>
      )}
      {losses.length > 0 && (
        <section className="losses">
          <h3>Geschlagen von</h3>
          <ul aria-label="Niederlagen">
            {losses.map((g) => <li key={g.game}>Spiel {g.game}: {teamName(g.opp)}</li>)}
          </ul>
        </section>
      )}
      <p className="share-text">{text}</p>
      <div className="stack">
        <button type="button" className="btn btn--quiet" onClick={async () => setStatus(SHARE_STATUS[await shareResult(text)])}>
          Ergebnis teilen
        </button>
        {status && <p className="muted" role="status">{status}</p>}
        {puzzleNo !== null && <p className="muted">Nächstes Rätsel in {countdown(msUntilNextPuzzle(clock))}</p>}
        <button type="button" className="btn btn--quiet" onClick={onAgain}>
          {puzzleNo === null ? "Nochmal" : "Freies Spiel spielen"}
        </button>
        <button type="button" className="btn btn--quiet" onClick={onHome}>Zum Start</button>
      </div>
    </>
  );
}
