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
  it("zeigt alle Angebote als Matrix: fünf Tier-Zeilen mit je höchstens fünf Kacheln, ohne Gesamtstärke", () => {
    const session = newSession("free", new Date("2026-11-02T10:00:00Z"), data.pool, data.budget);
    render(<DraftScreen session={session} data={data} settings={settings} onPick={() => {}} onExit={() => {}} onRefresh={() => {}} />);
    const rows = screen.getAllByRole("row");
    expect(rows.map((r) => within(r).getByRole("rowheader").textContent)).toEqual(["T1", "T2", "T3", "T4", "T5"]);
    rows.forEach((row, i) => {
      const tier = (i + 1) as 1 | 2 | 3 | 4 | 5;
      const labels = within(row).queryAllByRole("button").map((b) => b.getAttribute("aria-label") ?? "");
      expect(labels).toHaveLength(session.draft.offers[tier].length);
      session.draft.offers[tier].forEach((p, j) => expect(labels[j]).toContain(p.name));
      expect(labels.length).toBeLessThanOrEqual(5);
    });
    expect(screen.queryByText(/Stärke/)).not.toBeInTheDocument();
  });

  it("öffnet per Antippen die Detailkarte und meldet den gewählten Spieler nach oben", () => {
    const session = newSession("free", new Date("2026-11-02T10:00:00Z"), data.pool, data.budget);
    const onPick = vi.fn();
    render(<DraftScreen session={session} data={data} settings={settings} onPick={onPick} onExit={() => {}} onRefresh={() => {}} />);
    const card = session.draft.offers[5][0];
    fireEvent.click(screen.getByRole("button", { name: new RegExp(card.name) }));
    const dialog = screen.getByRole("dialog", { name: card.name });
    expect(within(dialog).getAllByRole("meter")).toHaveLength(5);
    fireEvent.click(within(dialog).getByRole("button", { name: `${card.name} verpflichten` }));
    expect(onPick).toHaveBeenCalledWith(card);
  });

  it("verpflichtet per Ziehen einer Kachel direkt auf den Zielplatz", () => {
    const session = newSession("free", new Date("2026-11-02T10:00:00Z"), data.pool, data.budget);
    const onPick = vi.fn();
    render(<DraftScreen session={session} data={data} settings={settings} onPick={onPick} onExit={() => {}} onRefresh={() => {}} onMove={() => {}} />);
    const card = Object.values(session.draft.offers).flat().find((p) => p.positions.includes("C") && isAffordable(p, [], data.pool, data.budget))!;
    const slot = screen.getByRole("button", { name: /^C: frei/ });
    vi.spyOn(document, "elementFromPoint").mockReturnValue(slot);
    const tile = screen.getByRole("button", { name: new RegExp(card.name) });
    fireEvent.pointerDown(tile, { pointerType: "mouse", clientX: 5, clientY: 300, button: 0 });
    fireEvent.pointerMove(window, { pointerType: "mouse", clientX: 5, clientY: 50 });
    fireEvent.pointerUp(window, { pointerType: "mouse", clientX: 5, clientY: 50 });
    expect(onPick).toHaveBeenCalledWith(card, 4);
    vi.restoreAllMocks();
  });

  it("bietet das Neuziehen genau einmal an", () => {
    const session = newSession("free", new Date("2026-11-02T10:00:00Z"), data.pool, data.budget);
    const onRefresh = vi.fn();
    const { rerender } = render(<DraftScreen session={session} data={data} settings={settings} onPick={() => {}} onExit={() => {}} onRefresh={onRefresh} />);
    fireEvent.click(screen.getByRole("button", { name: /Matrix neu ziehen/ }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
    const used = { ...session, draft: { ...session.draft, refreshedAt: 0 } };
    rerender(<DraftScreen session={used} data={data} settings={settings} onPick={() => {}} onExit={() => {}} onRefresh={onRefresh} />);
    expect(screen.getByRole("button", { name: /Schon neu gezogen/ })).toBeDisabled();
  });

  it("graut Spieler ohne freien Platz aus und nennt den Grund", () => {
    const base = newSession("free", new Date("2026-11-02T10:00:00Z"), data.pool, data.budget);
    const centers = data.pool.filter((p) => p.positions.length === 1 && p.positions[0] === "C");
    const shownCenter = Object.values(base.draft.offers).flat().find((p) => p.positions.length === 1 && p.positions[0] === "C")!;
    const otherCenter = centers.find((c) => c.id !== shownCenter.id)!;
    const session = { ...base, draft: { ...base.draft, picks: [otherCenter] } };
    render(<DraftScreen session={session} data={data} settings={settings} onPick={() => {}} onExit={() => {}} onRefresh={() => {}} />);
    const tile = screen.getByRole("button", { name: new RegExp(shownCenter.name) });
    expect(tile.getAttribute("aria-label")).toContain("kein freier Platz");
    fireEvent.click(tile);
    expect(within(screen.getByRole("dialog")).getByText("Für diese Position ist kein Platz mehr frei")).toBeInTheDocument();
  });

  it("markiert unbezahlbare Kacheln und sperrt sie in der Detailkarte mit Begründung", () => {
    const session = newSession("free", new Date("2026-11-02T10:00:00Z"), data.pool, data.budget);
    const poor = { ...data, budget: 40_000_000 };
    render(<DraftScreen session={session} data={poor} settings={settings} onPick={() => {}} onExit={() => {}} onRefresh={() => {}} />);
    const locked = session.draft.offers[1].filter((p) => !isAffordable(p, [], poor.pool, poor.budget));
    expect(locked.length).toBeGreaterThan(0);
    const tile = screen.getByRole("button", { name: new RegExp(locked[0].name) });
    expect(tile.getAttribute("aria-label")).toContain("zu teuer");
    fireEvent.click(tile);
    const dialog = screen.getByRole("dialog", { name: locked[0].name });
    expect(within(dialog).getByRole("button", { name: `${locked[0].name} verpflichten` })).toBeDisabled();
    expect(within(dialog).getByText("Danach reicht das Budget nicht mehr für die restlichen Plätze")).toBeInTheDocument();
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
