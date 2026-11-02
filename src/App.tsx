import { useMemo, useState } from "react";
import type { GameData, Settings } from "./app-data";
import InstallHelp from "./components/InstallHelp";
import { puzzleNumber } from "./game/daily";
import { moveSlot, pickPlayer, refreshOffers } from "./game/draft";
import { playSeason } from "./game/season";
import type { SeasonLog } from "./game/season";
import { newSession, seedKeyFor } from "./game/session";
import type { Session } from "./game/session";
import { recordSeason } from "./game/stats";
import type { Player, TradeDecision } from "./game/types";
import { canPromptInstall, detectPlatform, isStandalone, promptInstall, wantsInstall } from "./install";
import { DraftScreen } from "./screens/DraftScreen";
import { ResultScreen } from "./screens/ResultScreen";
import { RulesScreen } from "./screens/RulesScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { SquadScreen } from "./screens/SquadScreen";
import { StartScreen } from "./screens/StartScreen";
import { StatsScreen } from "./screens/StatsScreen";
import { TickerScreen } from "./screens/TickerScreen";
import { loadDaily, loadSettings, loadStats, saveDaily, saveSettings, saveStats, startSession, storageAvailable } from "./storage";

type View = "start" | "game" | "stats" | "rules" | "settings" | "install";

function seasonLog(session: Session, data: GameData, settings: Settings): SeasonLog {
  return playSeason({
    lineup: session.draft.picks, seedKey: seedKeyFor(session), options: settings,
    trade: session.trade, pool: data.pool, luxuryLine: data.luxuryLine,
  }, data.teams);
}

export default function App({ data }: { data: GameData }) {
  const [platform] = useState(() => detectPlatform(navigator.userAgent, isStandalone()));
  const [view, setView] = useState<View>(() => (wantsInstall(location.search) && platform !== "installed" ? "install" : "start"));
  const [canPrompt, setCanPrompt] = useState(canPromptInstall);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [stats, setStats] = useState(loadStats);
  const [session, setSession] = useState<Session | null>(null);
  const [storageOk] = useState(storageAvailable);
  const [startTick, setStartTick] = useState(0);

  // Für den Startbildschirm: Stand des heutigen Tagesrätsels.
  const today = useMemo(() => {
    const saved = loadDaily(new Date(), data.pool, data.budget);
    if (!saved) return { result: null, inProgress: false };
    if (saved.phase !== "result") return { result: null, inProgress: true };
    const log = seasonLog(saved, data, settings);
    return { result: { wins: log.wins, losses: log.losses }, inProgress: false };
  }, [data, settings, startTick]);

  function update(next: Session) {
    setSession(next);
    saveDaily(next);
  }

  function home() {
    setSession(null);
    setStartTick((t) => t + 1);
    setView("start");
  }

  function open(mode: Session["mode"]) {
    const next = mode === "daily" ? startSession("daily", new Date(), data.pool, data.budget)
      : newSession("free", new Date(), data.pool, data.budget);
    setSession(next);
    setView("game");
  }

  function pick(player: Player, slot?: number) {
    if (!session) return;
    const draft = pickPlayer(session.draft, player, data.pool, session.runSeed, data.budget, slot);
    update({ ...session, draft, phase: draft.picks.length === 5 ? "squad" : "draft" });
  }

  function move(from: number, to: number) {
    if (!session) return;
    update({ ...session, draft: moveSlot(session.draft, from, to) });
  }

  function refresh() {
    if (!session || session.draft.refreshedAt !== null) return;
    update({ ...session, draft: refreshOffers(session.draft, data.pool, session.runSeed, data.budget) });
  }

  function startSeason() {
    if (!session) return;
    update({ ...session, phase: "season", trade: settings.deadline ? "pending" : undefined });
  }

  function decide(decision: TradeDecision) {
    if (session) update({ ...session, trade: decision });
  }

  function finish(log: SeasonLog, decision: TradeDecision | undefined) {
    if (!session) return;
    const next = { ...session, trade: decision, phase: "result" as const };
    update(next);
    const recorded = recordSeason(stats, log, session.mode, session.date);
    setStats(recorded);
    saveStats(recorded);
  }

  function changeSettings(next: Settings) {
    setSettings(next);
    saveSettings(next);
  }

  let content: React.ReactNode;
  if (view === "stats") content = <StatsScreen stats={stats} onBack={home} />;
  else if (view === "rules") content = <RulesScreen onBack={home} />;
  else if (view === "settings") content = <SettingsScreen settings={settings} onChange={changeSettings} onBack={home} />;
  else if (view === "install") {
    content = <InstallHelp platform={platform} canPrompt={canPrompt} onClose={home}
      onPrompt={() => { void promptInstall().then(() => setCanPrompt(canPromptInstall())); }} />;
  } else if (view === "game" && session) {
    const lineup = session.draft.picks;
    if (session.phase === "draft") {
      content = <DraftScreen session={session} data={data} settings={settings} onPick={pick} onExit={home} onRefresh={refresh} onMove={move} />;
    } else if (session.phase === "squad") {
      content = <SquadScreen lineup={lineup} slots={session.draft.slots} data={data} settings={settings} onStart={startSeason} onMove={move} />;
    } else if (session.phase === "season" || session.phase === "deadline") {
      content = <TickerScreen key={session.runSeed} lineup={lineup} seedKey={seedKeyFor(session)} data={data} settings={settings}
        initialDecision={session.trade === "pending" ? undefined : session.trade ?? undefined}
        onDecision={decide} onDone={finish} />;
    } else {
      content = <ResultScreen log={seasonLog(session, data, settings)} lineup={lineup} teams={data.teams}
        puzzleNo={session.mode === "daily" ? puzzleNumber(new Date()) : null} now={new Date()}
        onAgain={() => open("free")} onHome={home} />;
    }
  } else {
    content = <StartScreen puzzleNo={puzzleNumber(new Date())} todayResult={today.result} dailyInProgress={today.inProgress}
      storageOk={storageOk} onDaily={() => open("daily")} onFree={() => open("free")}
      onStats={() => setView("stats")} onRules={() => setView("rules")} onSettings={() => setView("settings")} />;
  }

  return <main className="app">{content}</main>;
}
