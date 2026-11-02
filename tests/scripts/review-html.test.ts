// @vitest-environment node
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(`${process.cwd()}/package.json`);
const { JSDOM } = require("jsdom");
const { renderPoolHtml } = require("./scripts/review-html.cjs");
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
