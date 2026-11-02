import { useEffect, useMemo, useState } from "react";
import type { GameData, Settings } from "../app-data";
import { DeadlineSheet } from "../components/DeadlineSheet";
import { Scoreboard } from "../components/Scoreboard";
import { CONFIG } from "../config";
import { playSeason } from "../game/season";
import type { SeasonEvent, SeasonLog } from "../game/season";
import type { Player, TradeDecision } from "../game/types";

interface Props {
  lineup: Player[];
  seedKey: string;
  data: GameData;
  settings: Settings;
  /** Bereits getroffene Deadline-Entscheidung (z. B. nach Neuladen). */
  initialDecision?: TradeDecision;
  onDecision?: (decision: TradeDecision) => void;
  onDone: (log: SeasonLog, decision: TradeDecision | undefined) => void;
}

const GAMES = 82;

type Pause = { kind: "deadline" } | { kind: "event"; event: SeasonEvent };

function eventText(event: SeasonEvent): string {
  switch (event.kind) {
    case "injury-return": return `✅ ${event.player.name} ist zurück.`;
    case "bankrupt": return `💸 ${event.reason}`;
    case "trade": return event.injuredGames > 0 && event.filler
      ? `🔁 ${event.in.name} kommt für ${event.out.name}. 🚑 Er fällt noch aus, ${event.filler.name} übernimmt.`
      : `🔁 ${event.in.name} kommt für ${event.out.name}.`;
    default: return "";
  }
}

export function TickerScreen({ lineup, seedKey, data, settings, initialDecision, onDecision, onDone }: Props) {
  const [decision, setDecision] = useState<TradeDecision | "pending" | undefined>(
    settings.deadline ? (initialDecision !== undefined ? initialDecision : "pending") : undefined,
  );
  const log = useMemo(() => playSeason({
    lineup, seedKey, options: settings, trade: decision, pool: data.pool, luxuryLine: data.luxuryLine,
  }, data.teams), [lineup, seedKey, settings, decision, data]);

  const [shown, setShown] = useState(0);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [banner, setBanner] = useState<string | null>(null);

  // Ereignisse, für die der Ticker anhält (der Trade selbst wird nur als Hinweis gezeigt).
  const stops = log.events.filter((e) => e.kind === "injury-return" || e.kind === "bankrupt");
  const key = (e: SeasonEvent) => `${e.kind}-${e.afterGame}`;
  const deadlineOpen = log.status === "deadline" && shown >= CONFIG.sim.deadlineAfterGame;
  const openStop = stops.find((e) => e.afterGame <= shown && !seen.has(key(e)));
  const pause: Pause | null = deadlineOpen ? { kind: "deadline" } : openStop ? { kind: "event", event: openStop } : null;
  const limit = log.games.length;

  function nextStop(from: number): number {
    const candidates = stops.filter((e) => !seen.has(key(e)) && e.afterGame > from).map((e) => e.afterGame);
    if (log.status === "deadline") candidates.push(CONFIG.sim.deadlineAfterGame);
    return Math.min(limit, ...candidates.filter((g) => g > from));
  }

  useEffect(() => {
    if (pause || shown >= limit) return;
    const id = setTimeout(() => setShown((s) => s + 1), CONFIG.ui.tickerMs / GAMES);
    return () => clearTimeout(id);
  }, [shown, pause, limit]);

  const visible = log.games.slice(0, shown);
  const wins = visible.filter((g) => g.win).length;
  const losses = visible.length - wins;
  const finished = shown >= GAMES && log.status === "done";
  const lastLoss = [...visible].reverse().find((g) => !g.win);
  const teamName = (abbr: string) => data.teams.find((team) => team.abbr === abbr)?.name ?? abbr;

  function decide(next: TradeDecision) {
    setDecision(next);
    onDecision?.(next);
    const tradeEvent = next ? playSeason({
      lineup, seedKey, options: settings, trade: next, pool: data.pool, luxuryLine: data.luxuryLine,
    }, data.teams).events.find((e) => e.kind === "trade") : undefined;
    setBanner(tradeEvent ? eventText(tradeEvent) : null);
  }

  return (
    <>
      <Scoreboard wins={wins} losses={losses} />
      <div>
        <div className="ticker__meta"><span>Spiel {Math.min(shown, GAMES)} von {GAMES}</span></div>
        <div className="ticker__progress" aria-hidden="true"><span style={{ width: `${(shown / GAMES) * 100}%` }} /></div>
      </div>

      {lastLoss && (
        <p className="ticker__loss" aria-live="polite">❌ Spiel {lastLoss.game}: Niederlage gegen {teamName(lastLoss.opp)}</p>
      )}

      {banner && !pause && <p className="event">{banner}</p>}

      {pause?.kind === "event" && (
        <div className="event" role="status">
          <p>{eventText(pause.event)}</p>
          <button type="button" className="btn btn--main"
            onClick={() => setSeen((s) => new Set(s).add(key(pause.event)))}>Weiter</button>
        </div>
      )}

      {!finished && !pause && (
        <button type="button" className="btn btn--quiet" onClick={() => setShown(nextStop(shown))}>Vorspulen</button>
      )}
      {finished && (
        <button type="button" className="btn btn--main"
          onClick={() => onDone(log, decision === "pending" ? undefined : decision)}>Zum Ergebnis</button>
      )}

      {pause?.kind === "deadline" && (
        <DeadlineSheet lineup={lineup} pool={data.pool} budget={data.budget} seedKey={seedKey}
          wins={wins} losses={losses} onDecide={decide} />
      )}
    </>
  );
}
