// Lädt die Stats-CSVs (Basketball-Reference-Kopie von sumitrodatta) nach data/source/.
// Vorhandene Dateien werden übersprungen, --force lädt neu. Höchstens ein Abruf alle 3 s.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = "https://raw.githubusercontent.com/sumitrodatta/bball-reference-datasets/HEAD/Data/";
const FILES = ["Player Per Game", "Team Stats Per Game", "Team Summaries", "End of Season Teams", "Player Season Info"];
const DIR = join(import.meta.dirname, "..", "data", "source");
const force = process.argv.includes("--force");
const sleep = ms => new Promise(r => setTimeout(r, ms));

mkdirSync(DIR, { recursive: true });
let first = true;
for (const name of FILES) {
  const target = join(DIR, name + ".csv");
  if (existsSync(target) && !force) { console.log("vorhanden:", name); continue; }
  if (!first) await sleep(3000);
  first = false;
  const res = await fetch(BASE + encodeURIComponent(name) + ".csv");
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  writeFileSync(target, await res.text());
  console.log("geladen:", name);
}
