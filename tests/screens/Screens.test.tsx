import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GameData } from "../../src/app-data";
import { isAffordable } from "../../src/game/draft";
import { newSession } from "../../src/game/session";
import type { SeasonLog } from "../../src/game/season";
import { DraftScreen } from "../../src/screens/DraftScreen";
import { ResultScreen } from "../../src/screens/ResultScreen";
import { TickerScreen } from "../../src/screens/TickerScreen";
import { FIXTURE_BUDGET, FIXTURE_LUXURY_LINE, FIXTURE_POOL, FIXTURE_TEAMS, makePlayer } from "../helpers/fixtures";

const data: GameData = { pool: FIXTURE_POOL, teams: FIXTURE_TEAMS, budget: FIXTURE_BUDGET, luxuryLine: FIXTURE_LUXURY_LINE };
const settings = { deadline: true, bankruptcy: true };

describe("DraftScreen", () => {
  it("zeigt fünf Tier-Reiter mit je höchstens fünf Karten ohne Gesamtstärke", () => {
    const session = newSession("free", new Date("2026-11-02T10:00:00Z"), data.pool, data.budget);
    render(<DraftScreen session={session} data={data} settings={settings} onPick={() => {}} onExit={() => {}} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["T1", "T2", "T3", "T4", "T5"]);
    for (const tab of tabs) {
      fireEvent.click(tab);
      const panel = screen.getByRole("tabpanel");
      expect(within(panel).getAllByRole("article").length).toBeLessThanOrEqual(5);
      expect(within(panel).queryByText(/Stärke/)).not.toBeInTheDocument();
    }
  });

  it("sperrt Karten, die das Budget sprengen würden, mit Begründung", () => {
    const session = newSession("free", new Date("2026-11-02T10:00:00Z"), data.pool, data.budget);
    const poor = { ...data, budget: 40_000_000 };
    render(<DraftScreen session={session} data={poor} settings={settings} onPick={() => {}} onExit={() => {}} />);
    fireEvent.click(screen.getByRole("tab", { name: "T1" }));
    const locked = session.draft.offers[1].filter((p) => !isAffordable(p, [], poor.pool, poor.budget));
    expect(locked.length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: `${locked[0].name} verpflichten` })).toBeDisabled();
    expect(screen.getAllByText("Danach reicht das Budget nicht mehr für die restlichen Plätze").length).toBeGreaterThan(0);
  });

  it("meldet den gewählten Spieler nach oben", () => {
    const session = newSession("free", new Date("2026-11-02T10:00:00Z"), data.pool, data.budget);
    const onPick = vi.fn();
    render(<DraftScreen session={session} data={data} settings={settings} onPick={onPick} onExit={() => {}} />);
    fireEvent.click(screen.getByRole("tab", { name: "T5" }));
    const card = session.draft.offers[5][0];
    fireEvent.click(screen.getByRole("button", { name: `${card.name} verpflichten` }));
    expect(onPick).toHaveBeenCalledWith(card);
  });
});

describe("TickerScreen", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());
  const lineup = [
    makePlayer({ id: "g1", positions: ["G"], name: "Guard Eins" }), makePlayer({ id: "g2", positions: ["G"], name: "Guard Zwei" }),
    makePlayer({ id: "f1", positions: ["F"], name: "Forward Eins" }), makePlayer({ id: "f2", positions: ["F"], name: "Forward Zwei" }),
    makePlayer({ id: "c1", positions: ["C"], name: "Center Eins" }),
  ];

  it("zählt nur die Bilanz hoch und zeigt keine Spielergebnisse", () => {
    render(<TickerScreen lineup={lineup} seedKey="t" data={data} settings={{ deadline: false, bankruptcy: false }} onDone={() => {}} />);
    act(() => { vi.advanceTimersByTime(1500); });
    const board = screen.getByRole("img", { name: /Bilanz/ });
    expect(board).toBeInTheDocument();
    expect(screen.queryByText(/:\d/)).not.toBeInTheDocument();
    expect(screen.queryByText(/gegen/)).not.toBeInTheDocument();
  });

  it("springt mit Vorspulen ans Ende und meldet das Saisonergebnis", () => {
    const onDone = vi.fn();
    render(<TickerScreen lineup={lineup} seedKey="t" data={data} settings={{ deadline: false, bankruptcy: false }} onDone={onDone} />);
    fireEvent.click(screen.getByRole("button", { name: "Vorspulen" }));
    fireEvent.click(screen.getByRole("button", { name: "Zum Ergebnis" }));
    const log: SeasonLog = onDone.mock.calls[0][0];
    expect(log.wins + log.losses).toBe(82);
  });

  it("hält an der Deadline an; „Kein Trade“ spielt die Saison zu Ende", () => {
    const onDone = vi.fn();
    render(<TickerScreen lineup={lineup} seedKey="t" data={data} settings={{ deadline: true, bankruptcy: false }} onDone={onDone} />);
    fireEvent.click(screen.getByRole("button", { name: "Vorspulen" }));
    const sheet = screen.getByRole("dialog", { name: "Trade Deadline" });
    fireEvent.click(within(sheet).getByRole("button", { name: "Kein Trade" }));
    fireEvent.click(screen.getByRole("button", { name: "Vorspulen" }));
    fireEvent.click(screen.getByRole("button", { name: "Zum Ergebnis" }));
    expect(onDone.mock.calls[0][0].games).toHaveLength(82);
  });

  it("zeigt bei verletzten Trade-Vorschlägen keine Ausfallzeit", () => {
    const overpaid = lineup.map((p, i) => i === 0 ? { ...p, overpaid: true, price: 40_000_000 } : p);
    const pool = [
      ...overpaid,
      ...Array.from({ length: 6 }, (_, i) => makePlayer({ id: `ok${i}`, name: `Gesund ${i}`, positions: ["G"], price: 40_000_000, overpaid: false })),
    ];
    render(<TickerScreen lineup={overpaid} seedKey="verletzt" data={{ ...data, pool }} settings={{ deadline: true, bankruptcy: false }} onDone={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Vorspulen" }));
    const sheet = screen.getByRole("dialog", { name: "Trade Deadline" });
    fireEvent.click(within(sheet).getByRole("button", { name: /Guard Eins/ }));
    expect(within(sheet).getAllByText("🚑 verletzt, Ausfall ungewiss").length).toBeGreaterThan(0);
    expect(within(sheet).queryByText(/\d+ Spiele/)).not.toBeInTheDocument();
  });
});

describe("ResultScreen", () => {
  it("zeigt Bilanz, Stufe und Teilen-Text", () => {
    const log: SeasonLog = { games: [], events: [], wins: 75, losses: 7, status: "done" };
    render(<ResultScreen log={log} lineup={FIXTURE_POOL.slice(0, 5)} puzzleNo={12} now={new Date("2026-11-02T10:00:00Z")} onAgain={() => {}} onHome={() => {}} />);
    expect(screen.getByRole("img", { name: "Bilanz 75 Siege, 7 Niederlagen" })).toBeInTheDocument();
    expect(screen.getByText("Warriors-Rekord geknackt")).toBeInTheDocument();
    expect(screen.getByText(/82-0 #12 · 75-7 🏆/)).toBeInTheDocument();
    expect(screen.getByText(/Nächstes Rätsel in/)).toBeInTheDocument();
  });
});
