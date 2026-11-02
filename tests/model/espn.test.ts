// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseEspnPage } from "../../scripts/fetch-espn-salaries.mjs";

const html = readFileSync(new URL("../fixtures/espn-2001-p1.html", import.meta.url), "utf8");

describe("parseEspnPage", () => {
  it("liest Kevin Garnett als ersten Spieler", () => {
    expect(parseEspnPage(html)[0]?.name).toBe("Kevin Garnett");
  });

  it("liest Gehalt und Team von Shaquille O'Neal", () => {
    expect(parseEspnPage(html).find(player => player.name === "Shaquille O'Neal")).toEqual({
      name: "Shaquille O'Neal",
      team: "Los Angeles Lakers",
      salary: 19285000,
    });
  });

  it("liest sämtliche 40 Datenzeilen mit gültigen Gehältern, Namen und Teams", () => {
    const table = html.match(/<table\b[^>]*class="tablehead"[^>]*>[\s\S]*?<\/table>/i)?.[0];
    expect(table).toBeDefined();
    const dataRows = table!.match(/<tr\b[^>]*class="(?:oddrow|evenrow)"[^>]*>/gi) ?? [];
    expect(dataRows).toHaveLength(40);

    const players = parseEspnPage(html);
    expect(players).toHaveLength(dataRows.length);
    for (const player of players) {
      expect(Number.isInteger(player.salary)).toBe(true);
      expect(player.salary).toBeGreaterThan(0);
      expect(player.name.trim()).not.toBe("");
      expect(player.team.trim()).not.toBe("");
    }
  });

  it("gibt ohne Spielerzeilen ein leeres Array zurück", () => {
    expect(parseEspnPage("<html></html>")).toEqual([]);
  });

  it("dekodiert HTML-Entities im Spielernamen", () => {
    const encoded = html.replace(">Shaquille O'Neal</a>", ">Shaquille O&#39;Neal</a>");
    expect(encoded).toContain(">Shaquille O&#39;Neal</a>");
    expect(parseEspnPage(encoded).find(player => player.name === "Shaquille O'Neal")?.salary)
      .toBe(19285000);
  });
});
