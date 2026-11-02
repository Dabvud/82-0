// @vitest-environment node
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(`${process.cwd()}/package.json`);
const { JSDOM } = require("jsdom");
const { renderPoolHtml, renderDataHtml } = require("./scripts/review-html.cjs");
const fixture = {
  kandidaten: [
    { id: "a", name: "Alpha", positions: ["G", "F"], peak: { from: 2000, to: 2002 },
      group: "allstar", tncTier: 1, strength: 90, selected: true, grund: "TNC-Gruppe Allstar" },
    { id: "b", name: "Beta", positions: ["C"], peak: { from: 2003, to: 2005 },
      group: "aktiv", tncTier: 3, strength: 40, selected: false, grund: "Nicht vorausgewählt" },
  ],
  ergaenzungen: [{ id: "extra", name: 'Extra </script><img src=x onerror="window.attack=true">',
    positions: ["C"], peak: { from: 1990, to: 1992 }, group: "ergaenzung", tncTier: null,
    strength: 50, selected: false, grund: "Optional" }],
  ungeklaert: [{ id: "unknown", name: "Unbekannt", kandidaten: ["maybe01"] }],
};
const open = () => new JSDOM(renderPoolHtml(fixture), { runScripts: "dangerously" });

describe("Pool-Klickliste", () => {
  it("zeigt sichere Namen und zählt Mehrfachpositionen nach jeder Auswahl", () => {
    const dom = open();
    const doc = dom.window.document;
    expect(doc.querySelector("#total")?.textContent).toBe("1");
    expect(doc.querySelector("#count-G")?.textContent).toBe("1");
    expect(doc.querySelector("#count-F")?.textContent).toBe("1");
    expect(doc.querySelector("#count-C")?.textContent).toBe("0");
    expect(doc.querySelectorAll('input[type="checkbox"]')).toHaveLength(3);
    expect(doc.querySelectorAll("img")).toHaveLength(0);
    expect(doc.body.textContent).toContain(fixture.ergaenzungen[0].name);
    (doc.querySelector('[data-id="extra"] input') as HTMLInputElement).click();
    expect(doc.querySelector("#total")?.textContent).toBe("2");
    expect(doc.querySelector("#count-C")?.textContent).toBe("1");
    dom.window.close();
  });
  it("kombiniert Positionsfilter und Suche, ohne die Auswahl zu verlieren", () => {
    const dom = open();
    const doc = dom.window.document;
    (doc.querySelector('[data-pos="C"]') as HTMLButtonElement).click();
    expect((doc.querySelector('[data-id="a"]') as HTMLElement).hidden).toBe(true);
    const search = doc.querySelector("#search") as HTMLInputElement;
    search.value = "beta";
    search.dispatchEvent(new dom.window.Event("input"));
    expect((doc.querySelector('[data-id="b"]') as HTMLElement).hidden).toBe(false);
    expect((doc.querySelector('[data-id="extra"]') as HTMLElement).hidden).toBe(true);
    expect(doc.querySelector("#total")?.textContent).toBe("1");
    dom.window.close();
  });
  it("kopiert nur die Differenz und zeigt bei fehlender Zwischenablage das Textfeld", async () => {
    const dom = open();
    const doc = dom.window.document;
    (doc.querySelector('[data-id="a"] input') as HTMLInputElement).click();
    (doc.querySelector('[data-id="b"] input') as HTMLInputElement).click();
    (doc.querySelector('[data-id="extra"] input') as HTMLInputElement).click();
    (doc.querySelector("#copy") as HTMLButtonElement).click();
    await new Promise(resolve => setTimeout(resolve, 0));
    const fallback = doc.querySelector("#copy-text") as HTMLTextAreaElement;
    expect(fallback.hidden).toBe(false);
    expect(fallback.value).toBe("POOL-AUSWAHL abgewählt: a | hinzugefügt: b,extra");
    let copied = "";
    Object.defineProperty(dom.window.navigator, "clipboard", { value: { writeText: async (value: string) => { copied = value; } } });
    (doc.querySelector("#copy") as HTMLButtonElement).click();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(copied).toBe(fallback.value);
    expect(fallback.hidden).toBe(true);
    dom.window.close();
  });
});

const dataFixture = {
  players: [
    { id: "a", name: "Alpha" }, { id: "b", name: "Beta" },
    { id: "missing", name: "Ohne Gehalt" }, { id: "no-cap", name: "Ohne Cap" },
  ],
  contracts: {
    a: { season: 1998, salary: 20000000, source: "https://example.org/gehalt", note: "unsicher: Beleg fehlt teilweise" },
    b: { season: 2000, salary: 2000000, source: "javascript:window.attack=true" },
    missing: null,
    "no-cap": { season: 1974, salary: 100000, source: "https://example.org/alt" },
  },
  salaryCap: { caps: { "1998": 20000000, "2000": 40000000, "2027": 164961000 } },
  estimates: {
    a: { tovPer36: 3.5, orbShare: 0.25, stlPer36: 1.2, blkPer36: 2.8,
      reason: 'Anker 1973/74 </script><img src=x onerror="window.attack=true">',
      sources: ["https://example.org/statistik", "javascript:window.attack=true"] },
    b: { tovPer36: 2.6, orbShare: null, stlPer36: null, blkPer36: null,
      reason: "Eigene Saison 1977/78", sources: ["https://example.org/b"] },
  },
  contractReport: "| Ohne Gehalt | `missing` | — | — | — | [Recherche](https://example.org/recherche_(alt)) | Jahresaufteilung unklar. |",
};
const openData = () => new JSDOM(renderDataHtml(dataFixture), { runScripts: "dangerously" });
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

describe("Daten-Klickliste", () => {
  it("zeigt Gehälter, den ungekürzten Cap-Anteil, gedeckelte heutige Preise und null-Hinweise", () => {
    const dom = openData();
    const doc = dom.window.document;
    expect([...doc.querySelectorAll("h2")].map((node: Element) => node.textContent))
      .toEqual(["Gehälter vor 2000", "Schätzwerte Legenden"]);
    const salary = doc.querySelector('#contracts [data-id="a"]');
    expect(salary.textContent).toContain("1997/98");
    expect(salary.textContent).toContain("20.000.000");
    expect(salary.textContent).toContain("100,00 %");
    expect(salary.textContent).toContain("57,74 Mio. $");
    expect(salary.classList.contains("uncertain")).toBe(true);
    const beta = doc.querySelector('#contracts [data-id="b"]');
    expect(beta.textContent).toContain("5,00 %");
    expect(beta.textContent).toContain("8,25 Mio. $");
    const missing = doc.querySelector('#contracts [data-id="missing"]');
    expect(missing.textContent).toContain("Marktwert-Stufe nach Tier");
    expect(missing.textContent).toContain("Jahresaufteilung unklar.");
    expect(missing.querySelector("a").href).toBe("https://example.org/recherche_(alt)");
    expect(doc.querySelector('#contracts [data-id="no-cap"]').textContent).toContain("Cap nicht verfügbar");
    expect(doc.body.textContent).not.toMatch(/NaN|Infinity/);
    expect([...doc.querySelectorAll('input[type="checkbox"]')].every((input: HTMLInputElement) => input.checked)).toBe(true);
    expect(doc.querySelectorAll('input[type="checkbox"]')).toHaveLength(6);
    dom.window.close();
  });

  it("zeigt vier Raten samt Quellen sicher und lässt nicht benötigte Werte leer", () => {
    const dom = openData();
    const doc = dom.window.document;
    const alpha = doc.querySelector('#estimates [data-id="a"]');
    expect(alpha.textContent).toContain("3,5");
    expect(alpha.textContent).toContain("25,00 %");
    expect(alpha.textContent).toContain("1,2");
    expect(alpha.textContent).toContain("2,8");
    expect(alpha.textContent).toContain(dataFixture.estimates.a.reason);
    expect(alpha.querySelector("a").href).toBe("https://example.org/statistik");
    expect(doc.querySelector('#estimates [data-id="b"]').textContent).toContain("nicht benötigt");
    expect(doc.querySelectorAll("img")).toHaveLength(0);
    expect(doc.querySelectorAll('a[href^="javascript:"]')).toHaveLength(0);
    dom.window.close();
  });

  it("kopiert nur Abwahl und Korrekturen beider Abschnitte mit eindeutiger Zuordnung", async () => {
    const dom = openData();
    const doc = dom.window.document;
    doc.querySelector('#contracts [data-id="a"] input').click();
    const correction = doc.querySelector('#estimates [data-id="a"] textarea');
    correction.value = "  TOV bitte 3,2\nund BLK 2,5  ";
    correction.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    doc.querySelector("#copy").click();
    await tick();
    const fallback = doc.querySelector("#copy-text");
    expect(fallback.hidden).toBe(false);
    expect(fallback.value).toBe("DATEN-KORREKTUREN\na: Gehalt: bitte prüfen (passt abgewählt)\na: Schätzwerte: TOV bitte 3,2 und BLK 2,5");
    let copied = "";
    Object.defineProperty(dom.window.navigator, "clipboard", { value: { writeText: async (value: string) => { copied = value; } } });
    doc.querySelector("#copy").click();
    await tick();
    expect(copied).toBe(fallback.value);
    expect(fallback.hidden).toBe(true);
    dom.window.close();
  });

  it("meldet keine bei unveränderten Zeilen und zeigt den Fallback auch bei verweigerter Zwischenablage", async () => {
    const dom = openData();
    const doc = dom.window.document;
    Object.defineProperty(dom.window.navigator, "clipboard", { value: { writeText: async () => { throw new Error("Kein Zugriff"); } } });
    doc.querySelector('#contracts [data-id="b"] textarea').value = "  \n ";
    doc.querySelector("#copy").click();
    await tick();
    expect(doc.querySelector("#copy-text").value).toBe("DATEN-KORREKTUREN keine");
    expect(doc.querySelector("#copy-text").hidden).toBe(false);
    doc.querySelector('#contracts [data-id="b"] input').click();
    expect(doc.querySelector("#copy-text").hidden).toBe(true);
    dom.window.close();
  });

  it("schaltet zwischen hellem und dunklem Design um", () => {
    const dom = openData();
    const doc = dom.window.document;
    doc.querySelector("#theme").click();
    expect(doc.documentElement.dataset.theme).toBe("dark");
    doc.querySelector("#theme").click();
    expect(doc.documentElement.dataset.theme).toBe("light");
    dom.window.close();
  });
});
