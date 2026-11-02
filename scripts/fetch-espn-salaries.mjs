import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { setTimeout } from "node:timers/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

function decodeEntities(text) {
  const named = { amp: "&", apos: "'", quot: '"', lt: "<", gt: ">", nbsp: " " };
  return text.replace(/&(#x[\da-f]+|#\d+|amp|apos|quot|lt|gt|nbsp);/gi, (entity, code) => {
    if (!code.startsWith("#")) return named[code.toLowerCase()];
    const hex = code[1].toLowerCase() === "x";
    const value = Number.parseInt(code.slice(hex ? 2 : 1), hex ? 16 : 10);
    return value > 0 && value <= 0x10ffff && !(value >= 0xd800 && value <= 0xdfff)
      ? String.fromCodePoint(value)
      : entity;
  });
}

function plainText(html) {
  return decodeEntities(html.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
}

/** Liest Spielerzeilen; wiederholte Tabellenköpfe werden übersprungen. */
export function parseEspnPage(html) {
  const players = [];
  for (const [, table] of html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)) {
    for (const [, row] of table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(match => match[1]);
      if (cells.length !== 4 || !/^\d+$/.test(plainText(cells[0]))) continue;

      // Der Positionszusatz steht außerhalb des Namenslinks; Teams haben nicht immer einen Link.
      const nameHtml = cells[1].match(/<a\b[^>]*>([\s\S]*?)<\/a>/i)?.[1];
      const name = nameHtml === undefined
        ? plainText(cells[1]).replace(/,\s*(?:PG|SG|SF|PF|C|G|F)$/i, "").trim()
        : plainText(nameHtml);
      const team = plainText(cells[2]);
      const salaryText = plainText(cells[3]);
      if (!/^\$\s*(?:\d{1,3}(?:,\d{3})+|\d+)$/.test(salaryText)) continue;
      const salary = Number(salaryText.replace(/[$,\s]/g, ""));
      if (name && team && Number.isSafeInteger(salary) && salary > 0) {
        players.push({ name, team, salary });
      }
    }
  }
  return players;
}

async function main() {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const sourceDir = join(root, "data", "source", "espn");
  const rawDir = join(root, "data", "raw");
  mkdirSync(sourceDir, { recursive: true });
  mkdirSync(rawDir, { recursive: true });

  const salaries = [];
  const counts = new Map();
  let fetched = false;
  for (let season = 2001; season <= 2027; season++) {
    let count = 0;
    for (let page = 1; ; page++) {
      const target = join(sourceDir, `${season}-${page}.html`);
      let html;
      if (existsSync(target)) {
        html = readFileSync(target, "utf8");
      } else {
        // Auch über Saison- und Cache-Grenzen mindestens 3 s zwischen echten Abrufen warten.
        if (fetched) await setTimeout(3000);
        fetched = true;
        const url = `https://www.espn.com/nba/salaries/_/year/${season}/page/${page}`;
        const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        if (!response.ok) throw new Error(`${season}, Seite ${page}: HTTP ${response.status}`);
        html = await response.text();
        writeFileSync(target, html, "utf8");
      }

      const players = parseEspnPage(html);
      if (players.length === 0) break;
      salaries.push(...players.map(player => ({ season, ...player })));
      count += players.length;
    }
    counts.set(season, count);
  }

  salaries.sort((a, b) => a.season - b.season || b.salary - a.salary);
  writeFileSync(join(rawDir, "espn-salaries.json"), JSON.stringify(salaries, null, 2) + "\n", "utf8");
  for (const [season, count] of counts) console.log(`${season}: ${count} Einträge`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
