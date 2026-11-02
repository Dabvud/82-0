import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BudgetBar } from "../../src/components/BudgetBar";
import { CategoryBars } from "../../src/components/CategoryBars";
import { PlayerCard } from "../../src/components/PlayerCard";
import { SlotBar } from "../../src/components/SlotBar";
import { formatMoney } from "../../src/format";
import { makePlayer } from "../helpers/fixtures";

const CAP = 164_961_000;

describe("formatMoney", () => {
  it("schreibt Beträge in Millionen mit deutschem Komma", () => {
    expect(formatMoney(33_140_000)).toBe("33,1 Mio. $");
    expect(formatMoney(2_000_000)).toBe("2,0 Mio. $");
  });
});

describe("BudgetBar", () => {
  it("zeigt Restbudget und Luxussteuer-Markierung", () => {
    render(<BudgetBar spent={100_000_000} budget={1.4 * CAP} luxuryLine={1.2 * CAP} bankruptcyOn />);
    expect(screen.getByText(/130,9 Mio\. \$ übrig/)).toBeInTheDocument();
    expect(screen.getByTestId("luxury-marker")).toBeInTheDocument();
    expect(screen.queryByText(/Pleiterisiko/)).not.toBeInTheDocument();
  });

  it("färbt den Balken als Verlauf über das ganze Budget: der Füllstand zeigt die Farbe seiner Position", () => {
    const { container } = render(<BudgetBar spent={0.7 * CAP} budget={1.4 * CAP} luxuryLine={1.2 * CAP} bankruptcyOn />);
    const fill = container.querySelector(".budget__fill") as HTMLElement;
    expect(fill.style.width).toBe("50%");
    // Verlauf auf volle Spurbreite gestreckt: bei 50 % Füllung doppelt so breit wie der Balken.
    expect(fill.style.backgroundSize).toBe("200% 100%");
  });

  it("warnt über der Luxussteuergrenze nur, wenn die Pleite eingeschaltet ist", () => {
    const { rerender } = render(<BudgetBar spent={1.25 * CAP} budget={1.4 * CAP} luxuryLine={1.2 * CAP} bankruptcyOn />);
    expect(screen.getByText("⚠️ 10 % Pleiterisiko")).toBeInTheDocument();
    rerender(<BudgetBar spent={1.25 * CAP} budget={1.4 * CAP} luxuryLine={1.2 * CAP} bankruptcyOn={false} />);
    expect(screen.queryByText(/Pleiterisiko/)).not.toBeInTheDocument();
  });
});

describe("SlotBar", () => {
  it("zeigt die fünf Plätze G G F F C und setzt gewählte Spieler passend ein", () => {
    const picks = [makePlayer({ id: "c1", name: "Big Man", positions: ["C"] }), makePlayer({ id: "g1", name: "Kleiner", positions: ["G"] })];
    render(<SlotBar picks={picks} />);
    const slots = screen.getAllByRole("listitem");
    expect(slots.map((s) => s.getAttribute("data-pos"))).toEqual(["G", "G", "F", "F", "C"]);
    expect(within(slots[0]).getByText("Kleiner")).toBeInTheDocument();
    expect(within(slots[4]).getByText("Big Man")).toBeInTheDocument();
    expect(within(slots[2]).getByText("frei")).toBeInTheDocument();
  });
});

describe("CategoryBars", () => {
  it("zeigt die fünf Kategorien als Balken ohne Gesamtwert", () => {
    const cats = { shooter: 90, finisher: 40, playmaking: 70, rebound: 20, defense: 55, oreb: 10, dreb: 30, blk: 5 };
    render(<CategoryBars cats={cats} />);
    const bars = screen.getAllByRole("meter");
    expect(bars.map((b) => b.getAttribute("aria-label"))).toEqual(["Werfer", "Finisher", "Playmaking", "Rebound", "Defense"]);
    expect(bars[0]).toHaveAttribute("aria-valuenow", "90");
  });
});

describe("PlayerCard", () => {
  const player = makePlayer({ id: "mj", name: "Michael Jordan", positions: ["G", "F"], peak: { from: 1989, to: 1991 }, price: 57_736_350, strength: 97 });

  it("zeigt Name, Peak, Positionen und Preis, aber keine Stärke", () => {
    render(<PlayerCard player={player} onPick={() => {}} />);
    expect(screen.getByText("Michael Jordan")).toBeInTheDocument();
    expect(screen.getByText("Peak 1989–1991")).toBeInTheDocument();
    expect(screen.getByText("G/F")).toBeInTheDocument();
    expect(screen.getByText("57,7 Mio. $")).toBeInTheDocument();
    expect(screen.queryByText(/97/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Stärke/)).not.toBeInTheDocument();
  });

  it("wählt den Spieler per Knopf", async () => {
    const onPick = vi.fn();
    render(<PlayerCard player={player} onPick={onPick} />);
    await userEvent.click(screen.getByRole("button", { name: "Michael Jordan verpflichten" }));
    expect(onPick).toHaveBeenCalledWith(player);
  });

  it("sperrt den Knopf und nennt den Grund", () => {
    render(<PlayerCard player={player} onPick={() => {}} disabledReason="Danach reicht das Budget nicht mehr für die restlichen Plätze" />);
    expect(screen.getByRole("button", { name: "Michael Jordan verpflichten" })).toBeDisabled();
    expect(screen.getByText("Danach reicht das Budget nicht mehr für die restlichen Plätze")).toBeInTheDocument();
  });
});
