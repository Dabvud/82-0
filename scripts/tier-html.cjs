// Klickliste: Tier-1-Spieler (→ T2 verschieben) und stärkste Tier-2-Spieler (→ T1 hochholen).
// Aufruf: node scripts/tier-html.cjs <zieldatei>
const fs = require("node:fs");
const players = JSON.parse(fs.readFileSync("src/data/players.json", "utf8"));
const target = process.argv[2];
if (!target) throw new Error("Zieldatei fehlt.");
const byStrength = (a, b) => b.strength - a.strength;
const t1 = players.filter((p) => p.tier === 1).sort(byStrength);
const t2 = players.filter((p) => p.tier === 2).sort(byStrength).slice(0, 20);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const mio = (n) => (n / 1e6).toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const row = (p, i, group) => `<label class="row"><input type="checkbox" data-group="${group}" value="${esc(p.id)}">
  <span class="rank">${i + 1}</span><span class="name">${esc(p.name)}</span>
  <span class="meta">${p.positions.join("/")} · Peak ${p.peak.from}–${p.peak.to} · ${mio(p.price)} Mio. $</span></label>`;
const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>82-0 – Tier 1 sortieren</title><style>
:root{color-scheme:light dark;--bg:#f6f1e8;--fg:#1d160d;--card:#fff;--acc:#b5651d}
@media (prefers-color-scheme:dark){:root{--bg:#14161c;--fg:#e9e6df;--card:#1e2129;--acc:#ffb21e}}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.4 system-ui,sans-serif}
main{max-width:40rem;margin:0 auto;padding:16px}
h1{font-size:1.4rem;margin:0 0 4px}h2{font-size:1.1rem;margin:22px 0 6px}
.row{display:grid;grid-template-columns:auto 2rem 1fr;gap:2px 8px;align-items:center;background:var(--card);border-radius:8px;padding:8px 10px;margin:4px 0}
.row input{width:1.2rem;height:1.2rem;grid-row:span 2;accent-color:var(--acc)}
.rank{grid-row:span 2;color:var(--acc);font-weight:700}.name{font-weight:600}.meta{font-size:.82rem;opacity:.75;grid-column:3}
.bar{position:sticky;top:0;background:var(--bg);padding:8px 0;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
button{font:inherit;padding:8px 14px;border-radius:8px;border:0;background:var(--acc);color:#1d160d;font-weight:700}
textarea{width:100%;height:5rem;margin-top:8px}
</style></head><body><main>
<h1>Tier 1 sortieren</h1><p>Haken bei Tier 1 = rutscht nach T2. Haken bei T2 = kommt nach T1. Danach „Auswahl kopieren“ und in den Chat einfügen.</p>
<div class="bar"><span id="count"></span><button type="button" id="copy">Auswahl kopieren</button></div>
<h2>Tier 1 (${t1.length} Spieler) – Haken = nach T2</h2>${t1.map((p, i) => row(p, i, "down")).join("")}
<h2>Stärkste 20 aus Tier 2 – Haken = nach T1</h2>${t2.map((p, i) => row(p, i, "up")).join("")}
<textarea id="out" readonly hidden></textarea>
<script>
const boxes=[...document.querySelectorAll("input[type=checkbox]")];
const ids=g=>boxes.filter(b=>b.dataset.group===g&&b.checked).map(b=>b.value);
const text=()=>"TIER-AUSWAHL nach T2: "+(ids("down").join(",")||"-")+" | nach T1: "+(ids("up").join(",")||"-");
const update=()=>{document.getElementById("count").textContent="Tier 1 danach: "+(${t1.length}-ids("down").length+ids("up").length)+" Spieler";};
boxes.forEach(b=>b.addEventListener("change",update));update();
document.getElementById("copy").addEventListener("click",async()=>{const t=text();const o=document.getElementById("out");
try{await navigator.clipboard.writeText(t);document.getElementById("copy").textContent="Kopiert ✓";}catch{o.hidden=false;o.value=t;o.select();}});
</script></main></body></html>`;
fs.writeFileSync(target, html, "utf8");
console.log(`Tier-Klickliste geschrieben: ${target} (T1: ${t1.length}, T2-Auszug: ${t2.length})`);
