// Klickliste junger Spieler, die (noch) nicht im Pool sind – mit echten Werten und einer Vorschau im Spiel.
// Aufruf: npx vite-node scripts/young-candidates.ts -- <zieldatei.html>
// Die Vorschau rechnet die Pipeline testweise mit Pool + Kandidaten, ohne Spieldaten zu schreiben.
import { readFileSync, writeFileSync } from "node:fs";
import { accoladesFrom } from "../src/model/strength";
import { normalizeName } from "../src/model/names";
import type { Pos } from "../src/model/types";
import { buildPlayers, teamsBySeasonFrom } from "./build-players";
import type { Estimate, ManualContract, Salary } from "./build-players";
import { loadSources, parseCsv } from "./lib/sources";
import type { PoolPlayer } from "./make-pool";

const readJson = <T,>(path: string): T => JSON.parse(readFileSync(path, "utf8"));
// Etablierte junge Spieler ohne Teamwechsel, die sonst durchs Raster fallen.
const MUST = ["Cade Cunningham", "Franz Wagner", "Trey Murphy III", "Shaedon Sharpe", "Walker Kessler", "Jabari Smith Jr.",
  "Keegan Murray", "Dyson Daniels", "Brandon Miller", "Ausar Thompson", "Dereck Lively II", "Jared McCain", "Zaccharie Risacher",
  "Josh Giddey", "Jalen Green", "Bennedict Mathurin"];

const perGame = parseCsv(readFileSync("data/source/Player Per Game.csv", "utf8")).filter((r) => r.lg === "NBA");
const first = new Map<string, number>();
for (const r of perGame) first.set(r.player_id, Math.min(first.get(r.player_id) ?? 9999, Number(r.season)));
const latest = new Map<string, Record<string, string>>();
for (const r of perGame) if (r.season === "2026" && (!latest.has(r.player_id) || Number(r.g) > Number(latest.get(r.player_id)!.g))) latest.set(r.player_id, r);

const pool = readJson<PoolPlayer[]>("data/manual/pool.json");
const inPool = new Set(pool.map((p) => p.bbrefId));
const salaries = readJson<Salary[]>("data/raw/espn-salaries.json");
const salary27 = new Map(salaries.filter((s) => s.season === 2027).map((s) => [normalizeName(s.name), s.salary]));

function positions(id: string): Pos[] {
  const set = new Set<Pos>();
  for (const r of perGame) {
    if (r.player_id !== id || Number(r.season) < 2024) continue;
    for (const part of r.pos.split("-")) {
      if (part === "PG" || part === "SG" || part === "G") set.add("G");
      if (part === "SF" || part === "PF" || part === "F") set.add("F");
      if (part === "C") set.add("C");
    }
  }
  return (["G", "F", "C"] as Pos[]).filter((p) => set.has(p));
}

const slug = (name: string) => normalizeName(name).replace(/\s+/g, "-");
const production = (r: Record<string, string>) => Number(r.pts_per_game) + Number(r.trb_per_game) + Number(r.ast_per_game);
const young = [...latest.values()].filter((r) => (first.get(r.player_id) ?? 0) >= 2021 && Number(r.g) >= 30 && !inPool.has(r.player_id));
const chosen = new Map<string, Record<string, string>>();
for (const r of [...young].sort((a, b) => production(b) - production(a)).slice(0, 40)) chosen.set(r.player_id, r);
for (const r of young) if (MUST.includes(r.player)) chosen.set(r.player_id, r);

const candidates: PoolPlayer[] = [...chosen.values()].map((r) => ({ id: slug(r.player), name: r.player, bbrefId: r.player_id, positions: positions(r.player_id) }))
  .filter((c) => c.positions.length > 0);

const { players } = buildPlayers([...pool, ...candidates], loadSources(),
  readJson<Record<string, Estimate>>("data/manual/estimates.json"), salaries,
  readJson<Record<string, ManualContract | null>>("data/manual/contracts-pre2000.json"),
  readJson<{ caps: Record<string, number> }>("data/manual/salary-cap.json").caps, {
    teamsBySeason: teamsBySeasonFrom(readFileSync("data/source/Player Per Game.csv", "utf8")),
    accolades: accoladesFrom(parseCsv(readFileSync("data/source/End of Season Teams.csv", "utf8")),
      parseCsv(readFileSync("data/source/Player Award Shares.csv", "utf8"))),
    tierOverrides: readJson<Record<string, number>>("data/manual/tier-overrides.json"),
  });
const ranked = [...players].sort((a, b) => b.strength - a.strength);
const mio = (n: number) => (n / 1e6).toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " Mio. $";
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

const rows = candidates.map((c) => {
  const p = players.find((x) => x.id === c.id)!;
  const r = chosen.get(c.bbrefId)!;
  return { c, p, r, rank: ranked.indexOf(p) + 1, sal: salary27.get(normalizeName(c.name)) ?? null };
}).sort((a, b) => a.rank - b.rank);

const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>82-0 – junge Spieler</title><style>
:root{color-scheme:light dark;--bg:#f6f1e8;--fg:#1d160d;--card:#fff;--acc:#b5651d;--good:#2f8f46;--bad:#c0392b}
@media (prefers-color-scheme:dark){:root{--bg:#14161c;--fg:#e9e6df;--card:#1e2129;--acc:#ffb21e;--good:#7fd18b;--bad:#ff6b5a}}
body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.4 system-ui,sans-serif}main{max-width:44rem;margin:0 auto;padding:16px}
h1{font-size:1.4rem;margin:0 0 4px}.row{display:grid;grid-template-columns:auto 1fr auto;gap:2px 10px;background:var(--card);border-radius:8px;padding:9px 11px;margin:5px 0}
.row input{width:1.2rem;height:1.2rem;grid-row:span 3;accent-color:var(--acc);align-self:center}.name{font-weight:700}.tag{font-size:.8rem;font-weight:700}
.good{color:var(--good)}.bad{color:var(--bad)}.meta,.game{grid-column:2/4;font-size:.84rem;opacity:.85}.game b{color:var(--acc)}
.bar{position:sticky;top:0;background:var(--bg);padding:8px 0;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
button{font:inherit;padding:8px 14px;border-radius:8px;border:0;background:var(--acc);color:#1d160d;font-weight:700}textarea{width:100%;height:5rem}
</style></head><body><main>
<h1>Junge Spieler für den Pool</h1>
<p>Echte Werte: Stats 2025/26 (Punkte/Rebounds/Assists), Gehalt 2026/27. <b>Im Spiel</b>: Vorschau, falls aufgenommen – Tier, Preis, Rang nach Stärke (von ${players.length}) und Schnäppchen-Wert (positiv = günstig für seine Stärke).</p>
<div class="bar"><span id="count"></span><button type="button" id="all">Alle anhaken</button><button type="button" id="copy">Auswahl kopieren</button></div>
${rows.map(({ c, p, r, rank, sal }) => `<label class="row"><input type="checkbox" value="${esc(c.id)}">
<span class="name">${esc(c.name)}</span><span class="tag ${p.value >= 4 ? "good" : p.value <= -4 ? "bad" : ""}">${p.value >= 4 ? "Schnäppchen" : p.value <= -4 ? "überbezahlt" : "fair"}</span>
<span class="meta">${c.positions.join("/")} · ${esc(r.team)} · Draft ${(first.get(c.bbrefId) ?? 0) - 1} · ${r.pts_per_game}/${r.trb_per_game}/${r.ast_per_game} · Gehalt ${sal ? mio(sal) : "–"}</span>
<span class="game">Im Spiel: <b>Tier ${p.tier}</b> · Preis ${mio(p.price)} · Rang ${rank} · Wert ${p.value >= 0 ? "+" : ""}${p.value.toFixed(0)}</span></label>`).join("")}
<textarea id="out" readonly hidden></textarea>
<script>
const boxes=[...document.querySelectorAll("input[type=checkbox]")];
const ids=()=>boxes.filter(b=>b.checked).map(b=>b.value);
const update=()=>{document.getElementById("count").textContent=ids().length+" ausgewählt";};
boxes.forEach(b=>b.addEventListener("change",update));update();
document.getElementById("all").addEventListener("click",()=>{boxes.forEach(b=>b.checked=true);update();});
document.getElementById("copy").addEventListener("click",async()=>{const t="JUNGE-AUSWAHL: "+(ids().join(",")||"-");const o=document.getElementById("out");
try{await navigator.clipboard.writeText(t);document.getElementById("copy").textContent="Kopiert ✓";}catch{o.hidden=false;o.value=t;o.select();}});
</script></main></body></html>`;

const target = process.argv.find((a) => a.endsWith(".html"));
if (!target) throw new Error("Zieldatei (.html) fehlt.");
writeFileSync(target, html, "utf8");
writeFileSync(".superpowers/junge-kandidaten.json", JSON.stringify(candidates, null, 2));
console.log(`${rows.length} Kandidaten → ${target}`);
for (const { c, p, rank } of rows.slice(0, 12)) console.log(`${c.name}: Tier ${p.tier}, Rang ${rank}, ${mio(p.price)}, Wert ${p.value.toFixed(0)}`);
