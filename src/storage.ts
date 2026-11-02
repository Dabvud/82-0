import { CONFIG } from "./config";
import { berlinDate, isCalendarDate } from "./game/daily";
import { pickPlayer, refreshOffers, SLOT_POSITIONS, startDraft } from "./game/draft";
import { newSession, seedKeyFor } from "./game/session";
import type { Session } from "./game/session";
import { emptyStats } from "./game/stats";
import type { Stats } from "./game/stats";
import { tradeOffers } from "./game/trade";
import type { Player } from "./game/types";

const KEYS = { settings: "82-0:v1:settings", daily: "82-0:v1:daily", stats: "82-0:v1:stats" };
export interface Settings { deadline: boolean; bankruptcy: boolean }

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isInteger = (value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= min && value <= max;

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch { return null; }
}

function write(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { /* Speicher voll oder blockiert: Das Spiel läuft trotzdem weiter. */ }
}

export function storageAvailable(): boolean {
  try {
    const key = "82-0:v1:storage-test";
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
    return true;
  } catch { return false; }
}

export function loadSettings(): Settings {
  const value = read(KEYS.settings);
  return isObject(value) && typeof value.deadline === "boolean" && typeof value.bankruptcy === "boolean"
    ? { deadline: value.deadline, bankruptcy: value.bankruptcy } : { deadline: true, bankruptcy: true };
}

export function saveSettings(settings: Settings): void { write(KEYS.settings, settings); }

/** Nach jedem Pick und Phasenwechsel aufrufen; freie Runden überschreiben den Tagesstand nicht. */
export function saveDaily(session: Session): void {
  if (session.mode !== "daily") return;
  const trade = session.trade && session.trade !== "pending"
    ? { outId: session.trade.outId, inId: session.trade.offer.player.id, injured: session.trade.offer.injured }
    : session.trade;
  write(KEYS.daily, { mode: session.mode, date: session.date, runSeed: session.runSeed,
    picks: session.draft.picks.map(player => player.id), refreshedAt: session.draft.refreshedAt, slots: session.draft.slots, phase: session.phase, trade });
}

export function loadDaily(now: Date, pool: Player[], budget: number): Session | null {
  const value = read(KEYS.daily);
  if (!isObject(value) || value.mode !== "daily" || !isCalendarDate(value.date) || value.date !== berlinDate(now)
    || value.runSeed !== value.date || !Array.isArray(value.picks) || value.picks.length > CONFIG.playersPerTeam
    || typeof value.phase !== "string" || !["draft", "squad", "season", "deadline", "result"].includes(value.phase)) return null;
  try {
    // Das einmalige Neuziehen wird an derselben Stelle nachgespielt (fehlt bei alten Ständen → nie).
    const refreshedAt = value.refreshedAt === undefined ? null : value.refreshedAt;
    if (refreshedAt !== null && !isInteger(refreshedAt, 0, value.picks.length)) return null;
    let draft = startDraft(pool, value.runSeed, budget);
    value.picks.forEach((id: unknown, index: number) => {
      if (refreshedAt === index) draft = refreshOffers(draft, pool, value.runSeed as string, budget);
      const player = typeof id === "string" ? pool.find(candidate => candidate.id === id) : undefined;
      if (!player) throw new Error("Unbekannte Spieler-ID im Speicher.");
      draft = pickPlayer(draft, player, pool, value.runSeed as string, budget);
    });
    if (refreshedAt === value.picks.length) draft = refreshOffers(draft, pool, value.runSeed as string, budget);
    // Selbst gewählte Aufstellung übernehmen, wenn sie genau die Picks auf passenden Plätzen enthält.
    if (value.slots !== undefined) {
      const slots = value.slots;
      const ids = draft.picks.map(p => p.id);
      if (!Array.isArray(slots) || slots.length !== SLOT_POSITIONS.length
        || slots.some((id: unknown, i: number) => id !== null && (typeof id !== "string" || !ids.includes(id)
          || !draft.picks.find(p => p.id === id)!.positions.includes(SLOT_POSITIONS[i])))
        || slots.filter((id: unknown) => id !== null).length !== ids.length
        || new Set(slots.filter((id: unknown) => id !== null)).size !== ids.length) return null;
      draft = { ...draft, slots: slots as (string | null)[] };
    }
    const phase = value.phase as Session["phase"];
    if (phase !== "draft" && draft.picks.length !== CONFIG.playersPerTeam) return null;
    const session: Session = { mode: "daily", date: value.date, runSeed: value.runSeed, draft, phase, trade: undefined };
    const trade = value.trade;
    if (trade === undefined || trade === null || trade === "pending") session.trade = trade;
    else {
      if (!isObject(trade) || typeof trade.outId !== "string" || typeof trade.inId !== "string" || typeof trade.injured !== "boolean") return null;
      const out = draft.picks.find(player => player.id === trade.outId);
      if (!out) return null;
      // Nur tatsächlich angebotene Trades übernehmen, einschließlich Verletzungsstatus.
      const offer = tradeOffers(draft.picks, out, pool, budget, seedKeyFor(session))
        .find(candidate => candidate.player.id === trade.inId && candidate.injured === trade.injured);
      if (!offer) return null;
      session.trade = { outId: out.id, offer };
    }
    if ((phase === "draft" || phase === "squad") && trade !== undefined) return null;
    if (phase === "deadline" && trade !== "pending") return null;
    if (phase === "result" && trade === "pending") return null;
    return session;
  } catch {
    // Erneutes Durchspielen prüft Angebote, doppelte Picks, Budget und Positionen.
    return null;
  }
}

/** Für den Startbildschirm: Ein abgeschlossenes Tagesrätsel bleibt beim Ergebnis. */
export function startSession(mode: Session["mode"], now: Date, pool: Player[], budget: number): Session {
  return (mode === "daily" ? loadDaily(now, pool, budget) : null) ?? newSession(mode, now, pool, budget);
}

function isStats(value: unknown): value is Stats {
  if (!isObject(value) || !isInteger(value.seasons) || !isInteger(value.totalWins, 0, value.seasons * 82)
    || !isInteger(value.perfect, 0, value.seasons) || !isInteger(value.dailyStreak, 0, value.seasons)
    || !(value.lastDaily === null || isCalendarDate(value.lastDaily)) || !isObject(value.byTier)) return false;
  if ((value.lastDaily === null) !== (value.dailyStreak === 0)) return false;
  if (value.seasons === 0) {
    if (value.best !== null) return false;
  } else if (!isObject(value.best) || !isInteger(value.best.wins, 0, 82) || !isInteger(value.best.losses, 0, 82)
    || value.best.wins + value.best.losses !== 82 || value.totalWins < value.best.wins
    || value.totalWins > value.seasons * value.best.wins) return false;
  let count = 0;
  for (const label of Object.keys(emptyStats().byTier)) {
    const amount = value.byTier[label];
    if (!isInteger(amount, 0, value.seasons)) return false;
    count += amount;
  }
  return count === value.seasons && value.byTier.Perfektion === value.perfect;
}

export function loadStats(): Stats {
  const value = read(KEYS.stats);
  return isStats(value) ? value : emptyStats();
}

export function saveStats(stats: Stats): void { write(KEYS.stats, stats); }
