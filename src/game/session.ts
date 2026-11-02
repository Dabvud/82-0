import { berlinDate } from "./daily";
import { startDraft } from "./draft";
import type { DraftState } from "./draft";
import type { Player, TradeDecision } from "./types";

export type Phase = "draft" | "squad" | "season" | "deadline" | "result";
export interface Session {
  mode: "daily" | "free";
  date: string | null;
  runSeed: string;
  draft: DraftState;
  trade: TradeDecision | "pending" | undefined;
  phase: Phase;
}

export function newSession(mode: Session["mode"], now: Date, pool: Player[], budget: number): Session {
  const date = mode === "daily" ? berlinDate(now) : null;
  const runSeed = date ?? crypto.randomUUID();
  return { mode, date, runSeed, draft: startDraft(pool, runSeed, budget), trade: undefined, phase: "draft" };
}

export function seedKeyFor(session: Session): string {
  // Der Draft-Zufall verändert die Bilanz derselben Five im freien Spiel nicht.
  // Trades verwenden eigene Zufallsströme; die ersten 50 Spiele bleiben unverändert.
  return JSON.stringify([session.mode, session.mode === "daily" ? session.date : null,
    session.draft.picks.map(player => player.id).sort()]);
}
