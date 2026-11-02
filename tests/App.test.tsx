import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import App from "../src/App";
import type { GameData } from "../src/app-data";
import { FIXTURE_BUDGET, FIXTURE_LUXURY_LINE, FIXTURE_POOL, FIXTURE_TEAMS } from "./helpers/fixtures";

const data: GameData = { pool: FIXTURE_POOL, teams: FIXTURE_TEAMS, budget: FIXTURE_BUDGET, luxuryLine: FIXTURE_LUXURY_LINE };

function pickAffordableCard() {
  // Kacheln der Matrix von unten (billig) nach oben durchprobieren.
  const tiles = screen.getAllByRole("row").flatMap((row) => within(row).queryAllByRole("button")).reverse();
  for (const tile of tiles) {
    if (tile.getAttribute("aria-label")?.includes("zu teuer")) continue;
    fireEvent.click(tile);
    const dialog = screen.getByRole("dialog");
    const pick = within(dialog).getByRole("button", { name: /verpflichten/ }) as HTMLButtonElement;
    if (!pick.disabled) { fireEvent.click(pick); return; }
    fireEvent.click(within(dialog).getByRole("button", { name: "Schließen" }));
  }
  throw new Error("Keine bezahlbare Karte");
}

describe("App", () => {
  beforeEach(() => localStorage.clear());

  it("führt vom Start über Draft und Kader bis zum Ergebnis", () => {
    render(<App data={data} />);
    expect(screen.getByRole("img", { name: /82 Siege, 0 Niederlagen/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Freies Spiel/ }));
    for (let i = 0; i < 5; i++) pickAffordableCard();
    expect(screen.getByRole("heading", { name: "Deine Starting Five" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").length).toBeGreaterThanOrEqual(5);
    fireEvent.click(screen.getByRole("button", { name: "Saison starten" }));
    fireEvent.click(screen.getByRole("button", { name: "Vorspulen" }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "Trade Deadline" })).getByRole("button", { name: "Kein Trade" }));
    fireEvent.click(screen.getByRole("button", { name: "Vorspulen" }));
    while (screen.queryByRole("button", { name: "Weiter" })) {
      fireEvent.click(screen.getByRole("button", { name: "Weiter" }));
      const forward = screen.queryByRole("button", { name: "Vorspulen" });
      if (forward) fireEvent.click(forward);
    }
    fireEvent.click(screen.getByRole("button", { name: "Zum Ergebnis" }));
    expect(screen.getByRole("button", { name: "Ergebnis teilen" })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("82-0:v1:stats")!).seasons).toBe(1);
  });

  it("schaltet die Trade Deadline in den Einstellungen ab", () => {
    render(<App data={data} />);
    fireEvent.click(screen.getByRole("button", { name: "Einstellungen" }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Trade Deadline/ }));
    expect(JSON.parse(localStorage.getItem("82-0:v1:settings")!).deadline).toBe(false);
  });

  it("setzt ein angefangenes Tagesrätsel mit denselben Picks fort", () => {
    const first = render(<App data={data} />);
    fireEvent.click(screen.getByRole("button", { name: /Tagesrätsel/ }));
    pickAffordableCard();
    const picked = screen.getAllByRole("listitem").map((li) => li.textContent);
    first.unmount();
    render(<App data={data} />);
    fireEvent.click(screen.getByRole("button", { name: /Tagesrätsel/ }));
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(picked);
    expect(screen.getByRole("heading", { name: "Pick 2 von 5" })).toBeInTheDocument();
  });

});
