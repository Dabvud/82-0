import { afterEach, describe, expect, it, vi } from "vitest";
import { shareText } from "../../src/game/share";
import { shareResult } from "../../src/share";
import type { SeasonLog } from "../../src/game/season";
import { makePlayer } from "../helpers/fixtures";

const lineup = ["Michael Jordan", "Larry Bird", "Stephen Curry", "Tim Duncan", "Shaquille O’Neal"].map((name, i) => makePlayer({ name, id: String(i) }));
const log = (wins: number): SeasonLog => ({ wins, losses: 82 - wins, games: [], events: [], status: "done" });
afterEach(() => vi.unstubAllGlobals());

describe("Teilen-Text", () => {
  it.each([[82, "💯"], [81, "🏆"], [74, "🏆"], [73, "🏀"]])("formatiert %i Siege mit %s", (wins, emoji) => {
    expect(shareText(12, log(Number(wins)), lineup)).toBe(`82-0 #12 · ${wins}-${82 - Number(wins)} ${emoji}\nJordan, Bird, Curry, Duncan, O’Neal\nhttps://dabvud.github.io/82-0/`);
  });

  it("enthält Trade und die Bilanz zum Pleite-Zeitpunkt", () => {
    const season = log(77);
    season.games = Array.from({ length: 70 }, (_, i) => ({ game: i + 1, win: i < 68, opp: "TEST", home: true }));
    season.events = [
      { kind: "trade", afterGame: 50, out: lineup[0], in: lineup[1], injuredGames: 0, filler: null },
      { kind: "bankrupt", afterGame: 70, out: lineup[1], in: lineup[0], reason: "Test" },
    ];
    const text = shareText(12, season, lineup);
    expect(text).toContain("🔁 Trade: Jordan → Bird");
    expect(text).toContain("💸 Pleite bei 68-2");
    expect(text.endsWith("https://dabvud.github.io/82-0/")).toBe(true);
  });

  it("lässt die Rätselnummer im freien Spiel weg", () => {
    const text = shareText(null, log(60), lineup);
    expect(text.split("\n")[0]).toBe("82-0 · 60-22 🏀");
    expect(text).not.toContain("#");
  });
});

describe("Web-Share und Zwischenablage", () => {
  it("nutzt das native Teilen", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share });
    expect(await shareResult("Ergebnis")).toBe("shared");
    expect(share).toHaveBeenCalledWith({ text: "Ergebnis" });
  });

  it("behandelt einen Abbruch ohne Kopieren", async () => {
    const writeText = vi.fn();
    vi.stubGlobal("navigator", { share: vi.fn().mockRejectedValue(new DOMException("Abbruch", "AbortError")), clipboard: { writeText } });
    expect(await shareResult("Ergebnis")).toBe("cancelled");
    expect(writeText).not.toHaveBeenCalled();
  });

  it.each([false, true])("kopiert ohne natives Teilen oder bei Fehler (%s)", async (fails) => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...(fails ? { share: vi.fn().mockRejectedValue(new Error("Fehler")) } : {}), clipboard: { writeText } });
    expect(await shareResult("Ergebnis")).toBe("copied");
    expect(writeText).toHaveBeenCalledWith("Ergebnis");
  });

  it("liefert bei fehlender Zwischenablage einen Fehlerstatus", async () => {
    vi.stubGlobal("navigator", {});
    expect(await shareResult("Ergebnis")).toBe("failed");
  });
});
