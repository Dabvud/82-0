const { readFileSync, writeFileSync } = require("node:fs");
const { resolve } = require("node:path");

function renderPoolHtml(proposal) {
  // JSON bleibt auch bei Namen mit HTML-Zeichen sicher im eingebetteten Skript.
  const data = JSON.stringify(proposal).replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>82-0 · Deinen Spielerpool prüfen</title>
<style>
:root{color-scheme:light dark;--bg:#f4f5f7;--surface:#fff;--ink:#15202e;--muted:#526176;--line:#d3dce6;--accent:#145dba;--tint:#eaf2ff;--green:#17603d}
@media(prefers-color-scheme:dark){:root{--bg:#10161f;--surface:#192331;--ink:#edf3fb;--muted:#aebed1;--line:#3b4c62;--accent:#9bc6ff;--tint:#203954;--green:#8de0b3}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,sans-serif}button,input,textarea{font:inherit}button{cursor:pointer;min-height:44px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--ink);padding:9px 17px;font-weight:650}button:hover{border-color:var(--accent)}button:focus-visible,input:focus-visible,textarea:focus-visible{outline:3px solid var(--accent);outline-offset:3px}[hidden]{display:none!important}
header{position:sticky;top:0;z-index:2;background:var(--surface);border-bottom:1px solid var(--line)}.bar{max-width:1100px;margin:auto;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px}.brand{font-weight:850;font-size:22px;letter-spacing:-1px}.counts{display:flex;flex-wrap:wrap;gap:8px 18px}.counts strong{font-variant-numeric:tabular-nums;color:var(--accent);font-size:21px}.counts span{white-space:nowrap}
main{max-width:1100px;margin:auto;padding:32px 24px 48px}.eyebrow{color:var(--accent);font-size:13px;font-weight:750;letter-spacing:1.5px;text-transform:uppercase}h1{font-size:clamp(28px,5vw,42px);line-height:1.15;letter-spacing:-1px;margin:12px 0 18px}h2{font-size:22px;line-height:1.25;margin:0}.intro{max-width:740px;color:var(--muted);margin:0 0 24px}.actions{display:flex;align-items:center;gap:14px;flex-wrap:wrap}.primary{background:var(--accent);color:var(--surface);border-color:var(--accent)}#status{color:var(--green);font-size:14px}#copy-text{width:100%;min-height:110px;margin-top:14px;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:12px;padding:12px}
.tools{display:flex;gap:16px;align-items:end;flex-wrap:wrap;padding:24px 0}.chips{display:flex;gap:8px}.chips button[aria-pressed="true"]{background:var(--tint);color:var(--accent);border-color:var(--accent)}.search{flex:1;min-width:220px}.search label{display:block;color:var(--muted);font-size:14px;margin-bottom:5px}.search input{width:100%;min-height:46px;border:1px solid var(--line);border-radius:12px;padding:10px 14px;background:var(--surface);color:var(--ink)}section{margin-top:25px}.section-head{display:flex;gap:12px;justify-content:space-between;align-items:baseline;margin-bottom:8px}.visible-count{color:var(--muted);font-size:14px;white-space:nowrap}.section-note{color:var(--muted);font-size:14px;margin:0 0 16px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.player{display:flex;gap:12px;padding:17px;background:var(--surface);border:1px solid var(--line);border-radius:14px;cursor:pointer;min-width:0}.player:has(input:checked){border-color:var(--accent);background:var(--tint)}.player input{flex-shrink:0;width:22px;height:22px;accent-color:var(--accent);margin:3px 0 0}.details{min-width:0;flex:1}.player-top{display:flex;gap:10px;justify-content:space-between;align-items:baseline}.name{font-size:17px;font-weight:750;overflow-wrap:anywhere}.pos{font-size:12px;font-weight:750;color:var(--accent);white-space:nowrap}.meta{color:var(--muted);font-size:13px;margin-top:4px}.reason{font-size:13px;margin-top:9px}.unresolved{border-left:3px solid var(--line);padding:8px 15px;margin:10px 0;overflow-wrap:anywhere}.empty{color:var(--muted);padding:12px 0}footer{border-top:1px solid var(--line);margin-top:35px;padding-top:18px;color:var(--muted);font-size:13px}
@media(max-width:620px){.bar{padding:10px 16px;gap:8px}.brand{font-size:20px}.counts{gap:2px 10px;font-size:13px;justify-content:flex-end}.counts strong{font-size:17px}main{padding:24px 16px}.grid{grid-template-columns:1fr}.tools{gap:14px}.search{flex-basis:100%}.section-head{flex-wrap:wrap}.player{padding:15px}.primary{width:100%}}
</style>
</head>
<body>
<header><div class="bar"><div class="brand">82-0</div><div class="counts" role="status" aria-label="Ausgewählte Spieler">
<span><strong id="total">0</strong> ausgewählt</span><span>G <strong id="count-G">0</strong></span><span>F <strong id="count-F">0</strong></span><span>C <strong id="count-C">0</strong></span>
</div></div></header>
<main>
<div class="eyebrow">Spielerpool · Deine Auswahl</div><h1>Wer gehört in deinen Pool?</h1>
<p class="intro">Prüfe den Vorschlag und ändere die Haken nach deinem Geschmack. Die 30 Ergänzungen sind optional. Kopiere danach deine Änderungen und füge sie in den Chat ein. Mehrfachpositionen zählen bei jeder passenden Position.</p>
<div class="actions"><button class="primary" id="copy" type="button">Auswahl kopieren</button><span id="status" role="status" aria-live="polite"></span></div>
<textarea id="copy-text" aria-label="Auswahl zum manuellen Kopieren" readonly hidden></textarea>
<div class="tools"><div class="chips" role="group" aria-label="Nach Position filtern">
<button type="button" data-pos="Alle" aria-pressed="true">Alle</button><button type="button" data-pos="G" aria-pressed="false">G</button><button type="button" data-pos="F" aria-pressed="false">F</button><button type="button" data-pos="C" aria-pressed="false">C</button>
</div><div class="search"><label for="search">Spieler suchen</label><input id="search" type="search" placeholder="Name, Gruppe oder Begründung …" autocomplete="off"></div></div>
<section aria-labelledby="tnc-title"><div class="section-head"><h2 id="tnc-title">Vorschlag aus The Next Chapter</h2><span class="visible-count" id="tnc-visible"></span></div>
<p class="section-note">Vorauswahl: alle zugeordneten Allstars und TNC-Tiers 1–2, dann Stärke und Positionsquoten. Auch nicht vorausgewählte TNC-Spieler sind hier wählbar.</p><div class="grid" id="tnc-list"></div><p class="empty" id="tnc-empty" hidden>Keine Treffer für diesen Filter.</p></section>
<section aria-labelledby="extras-title"><div class="section-head"><h2 id="extras-title">Ergänzungen</h2><span class="visible-count" id="extras-visible"></span></div>
<p class="section-note">Bekannte Rollenspieler, Defensivspezialisten und Center außerhalb von TNC. Kein Spieler ist vorausgewählt.</p><div class="grid" id="extras-list"></div><p class="empty" id="extras-empty" hidden>Keine Treffer für diesen Filter.</p></section>
<section aria-labelledby="unknown-title"><div class="section-head"><h2 id="unknown-title">Ungeklärt</h2><span class="visible-count" id="unknown-count"></span></div>
<p class="section-note">Diese Einträge brauchen eine eindeutige Zuordnung. Sie sind vorerst nicht wählbar; die Suche gilt auch hier, der Positionsfilter nur für zugeordnete Spieler.</p><div id="unknown-list"></div></section>
<footer>Stärken sind vorläufig (0–99): fehlende Spielerwerte zählen als 0. Historische Zweierwerte fehlen teilweise vollständig. Peak-Jahre sind Saison-Endjahre. Richtwert: 280 Spieler, mindestens 100 mit G und 60 mit C. Die Zähler beziehen sich immer auf die gesamte Auswahl. Beim Neuladen startet wieder der ursprüngliche Vorschlag.</footer>
</main>
<script>
const proposal = ${data};
const all = [...proposal.kandidaten, ...proposal.ergaenzungen];
const baseline = new Set(all.filter(p => p.selected).map(p => p.id));
const chosen = new Set(baseline);
const groups = {allstar:'Allstar',aktiv:'Aktiv',retired2020:'Seit 2020 zurückgetreten',journeyman:'Journeyman',ergaenzung:'Ergänzung'};
const rows = [];
let position = 'Alle';
const element = (tag, className, content) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
};
const normalize = s => s.normalize('NFD').replace(/\\p{M}/gu,'').toLowerCase().replace(/[.'’]/g,'');
function renderPlayers(players, prefix) {
  const list = document.getElementById(prefix + '-list');
  for (const player of players) {
    const row = element('label','player');
    row.dataset.id = player.id;
    const input = element('input'); input.type = 'checkbox'; input.checked = chosen.has(player.id);
    input.setAttribute('aria-label',player.name + ' auswählen');
    input.addEventListener('change',() => { input.checked ? chosen.add(player.id) : chosen.delete(player.id); updateCounts(); document.getElementById('status').textContent = ''; document.getElementById('copy-text').hidden = true; });
    const details = element('div','details');
    const top = element('div','player-top');
    top.append(element('span','name',player.name),element('span','pos',player.positions.join(' / ')));
    const group = (groups[player.group] || player.group) + (player.tncTier ? ' · TNC-Tier ' + player.tncTier : '');
    details.append(top,element('div','meta','Peak ' + player.peak.from + '–' + player.peak.to + ' · ' + group),element('div','meta','Vorläufige Stärke: ' + player.strength.toFixed(1).replace('.',',')),element('div','reason',player.grund));
    row.append(input,details); list.append(row);
    rows.push({row,player,prefix,search:normalize(player.name + ' ' + group + ' ' + player.grund)});
  }
}
renderPlayers(proposal.kandidaten,'tnc'); renderPlayers(proposal.ergaenzungen,'extras');
const unknownRows = proposal.ungeklaert.map(player => {
  const row = element('div','unresolved');
  row.append(element('strong','',player.name),element('div','meta',player.id + ' · Kandidaten: ' + (player.kandidaten.join(', ') || 'kein namensgleicher Treffer')));
  document.getElementById('unknown-list').append(row);
  return {row,search:normalize(player.name + ' ' + player.id + ' ' + player.kandidaten.join(' '))};
});
function updateCounts() {
  const selected = all.filter(player => chosen.has(player.id));
  document.getElementById('total').textContent = selected.length;
  for (const pos of ['G','F','C']) document.getElementById('count-' + pos).textContent = selected.filter(player => player.positions.includes(pos)).length;
}
function filter() {
  const query = normalize(document.getElementById('search').value.trim());
  const visible = {tnc:0,extras:0};
  for (const entry of rows) {
    entry.row.hidden = !(position === 'Alle' || entry.player.positions.includes(position)) || !entry.search.includes(query);
    if (!entry.row.hidden) visible[entry.prefix]++;
  }
  for (const prefix of ['tnc','extras']) {
    document.getElementById(prefix + '-visible').textContent = visible[prefix] + ' angezeigt';
    document.getElementById(prefix + '-empty').hidden = visible[prefix] !== 0;
  }
  for (const entry of unknownRows) entry.row.hidden = !entry.search.includes(query);
  document.getElementById('unknown-count').textContent = unknownRows.filter(entry => !entry.row.hidden).length + ' / ' + unknownRows.length;
}
for (const button of document.querySelectorAll('[data-pos]')) button.addEventListener('click',() => {
  position = button.dataset.pos;
  for (const chip of document.querySelectorAll('[data-pos]')) chip.setAttribute('aria-pressed',String(chip === button));
  filter();
});
document.getElementById('search').addEventListener('input',filter);
document.getElementById('copy').addEventListener('click',async () => {
  const removed = [...baseline].filter(id => !chosen.has(id)).sort();
  const added = [...chosen].filter(id => !baseline.has(id)).sort();
  const text = 'POOL-AUSWAHL abgewählt: ' + removed.join(',') + ' | hinzugefügt: ' + added.join(',');
  const fallback = document.getElementById('copy-text');
  fallback.value = text;
  try {
    await navigator.clipboard.writeText(text);
    fallback.hidden = true;
    document.getElementById('status').textContent = 'Kopiert. Jetzt in den Chat einfügen.';
  } catch {
    fallback.hidden = false; fallback.focus(); fallback.select();
    document.getElementById('status').textContent = 'Bitte den markierten Text manuell kopieren und in den Chat einfügen.';
  }
});
updateCounts(); filter();
</script>
</body>
</html>`;
}

function renderDataHtml({ players, contracts, salaryCap, estimates, contractReport = "" }) {
  // Der Bericht ergänzt Recherchelinks und Hinweise für Verträge ohne Zahlenwert.
  const reportRows = new Map(contractReport.split(/\r?\n/).filter(line => line.startsWith("|")).flatMap(line => {
    const cells = line.split("|").map(cell => cell.trim());
    const id = cells[2]?.match(/^`([^`]+)`$/)?.[1];
    if (!id) return [];
    return [[id, { source: cells[6]?.match(/\]\((https?:\/\/.+)\)/)?.[1], note: cells[7] === "—" ? "" : cells[7] }]];
  }));
  const names = new Map(players.map(player => [player.id, player.name]));
  const payload = {
    contracts: players.map(player => ({ ...player, contract: contracts[player.id] ?? null, report: reportRows.get(player.id) })),
    estimates: Object.entries(estimates).map(([id, estimate]) => ({ id, name: names.get(id) || id, ...estimate })),
    caps: salaryCap.caps,
  };
  // Auch Begründungen und Namen dürfen keinen Skriptabschluss einschleusen.
  const data = JSON.stringify(payload).replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>82-0 · Daten prüfen</title>
<style>
:root{color-scheme:light dark;--bg:#f4f5f7;--surface:#fff;--ink:#15202e;--muted:#526176;--line:#d3dce6;--accent:#145dba;--warn:#855100;--warning-bg:#fff6df}
@media(prefers-color-scheme:dark){:root:not([data-theme="light"]){color-scheme:dark;--bg:#10161f;--surface:#192331;--ink:#edf3fb;--muted:#aebed1;--line:#3b4c62;--accent:#9bc6ff;--warn:#ffd382;--warning-bg:#342b1c}}
:root[data-theme="dark"]{color-scheme:dark;--bg:#10161f;--surface:#192331;--ink:#edf3fb;--muted:#aebed1;--line:#3b4c62;--accent:#9bc6ff;--warn:#ffd382;--warning-bg:#342b1c}
:root[data-theme="light"]{color-scheme:light}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,sans-serif}button,input,textarea{font:inherit}[hidden]{display:none!important}a{color:var(--accent);overflow-wrap:anywhere}button{min-height:44px;padding:9px 16px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink);cursor:pointer;font-weight:650}button:hover{border-color:var(--accent)}button:focus-visible,input:focus-visible,textarea:focus-visible,a:focus-visible{outline:3px solid var(--accent);outline-offset:3px}
header{position:sticky;top:0;z-index:2;border-bottom:1px solid var(--line);background:var(--surface)}.bar{max-width:1440px;margin:auto;padding:12px 24px;display:flex;gap:16px;align-items:center;flex-wrap:wrap}.brand{font-weight:850;font-size:23px;margin-right:auto}.primary{background:var(--accent);color:var(--surface);border-color:var(--accent)}main{max-width:1440px;margin:auto;padding:30px 24px 60px}h1{font-size:clamp(28px,5vw,42px);line-height:1.15;margin:8px 0 16px}h2{font-size:25px;margin:0 0 12px}p{max-width:980px}.intro,.note,footer{color:var(--muted)}nav{display:flex;gap:20px;flex-wrap:wrap;margin:24px 0}section{margin-top:40px;scroll-margin-top:120px}.section-heading{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap}.count{font-size:14px;color:var(--muted)}.note{font-size:14px}#status{font-size:14px;color:var(--accent);margin:12px 0}#copy-text{width:100%;min-height:125px;padding:12px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink)}
table{width:100%;border-collapse:separate;border-spacing:0;background:var(--surface);border:1px solid var(--line);border-radius:12px;overflow:hidden;font-size:14px}th{text-align:left;background:var(--bg);font-size:12px;color:var(--muted)}th,td{padding:12px 10px;vertical-align:top;border-bottom:1px solid var(--line)}tbody tr:last-child td{border-bottom:0}.name{font-weight:750;font-size:16px}.id{display:block;font-size:11px;font-weight:400;color:var(--muted);overflow-wrap:anywhere}.numeric{font-variant-numeric:tabular-nums;white-space:nowrap}.uncertain{background:var(--warning-bg)}.badge{display:block;color:var(--warn);font-size:12px;font-weight:750;margin-top:5px}.sources{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.explanation{min-width:210px;max-width:410px;overflow-wrap:anywhere}.review{min-width:200px;width:220px}.check{display:flex;align-items:center;gap:9px;min-height:44px;font-weight:650}.check input{width:22px;height:22px;accent-color:var(--accent)}.correction-label{display:block;color:var(--muted);font-size:12px;margin:4px 0}.review textarea{width:100%;min-height:65px;resize:vertical;padding:8px;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--ink)}footer{margin-top:30px;border-top:1px solid var(--line);padding-top:16px;font-size:13px}
@media(max-width:1050px){main{padding:24px 16px}.bar{padding:10px 16px}table,tbody,tr,td{display:block;width:100%}table{border:0;background:transparent;overflow:visible}thead{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}tbody{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}tr{border:1px solid var(--line);border-radius:12px;background:var(--surface);padding:12px;min-width:0}td{padding:7px 0;border:0;max-width:none;min-width:0}td::before{content:attr(data-label);display:block;color:var(--muted);font-size:12px;font-weight:650}.review{width:100%;min-width:0;margin-top:8px;border-top:1px solid var(--line);padding-top:8px}.review::before{display:none}.numeric{white-space:normal}}
@media(max-width:600px){tbody{grid-template-columns:1fr}.bar{gap:8px}.brand{font-size:20px}.bar button{font-size:14px;padding:8px 10px}section{scroll-margin-top:140px}.section-heading{gap:4px 12px}}
</style>
</head>
<body>
<header><div class="bar"><div class="brand">82-0 · Datenprüfung</div><button id="theme" type="button">Hell / Dunkel</button><button id="copy" class="primary" type="button">Auswahl kopieren</button></div></header>
<main>
<h1>Historische Daten prüfen</h1>
<p class="intro">Alle Zeilen stehen zunächst auf „passt“. Nimm den Haken heraus oder trage eine Korrektur ein. „Auswahl kopieren“ sammelt nur diese Änderungen für den Chat. Beim Neuladen beginnt die Prüfung wieder mit den vorgeschlagenen Daten.</p>
<div id="status" role="status" aria-live="polite"></div><textarea id="copy-text" aria-label="Korrekturen zum manuellen Kopieren" readonly hidden></textarea>
<nav aria-label="Abschnitte"><a href="#contracts">Gehälter vor 2000</a><a href="#estimates">Schätzwerte Legenden</a></nav>
<section id="contracts" aria-labelledby="contracts-title"><div class="section-heading"><h2 id="contracts-title">Gehälter vor 2000</h2><span class="count" id="contracts-count"></span></div>
<p class="note">Höchstes gefundenes NBA-Jahresgehalt bis einschließlich 1999/2000. Cap-Anteil = Gehalt / Salary Cap derselben Saison. → Preis heute = min(35 %, Cap-Anteil) × 164,961 Mio. $. Saisonangaben verwenden das Endjahr. Offene Gehälter erhalten eine Marktwert-Stufe nach Tier; hier wird dafür kein Betrag erfunden. Unsichere Angaben sind farbig markiert.</p>
<table><thead><tr><th scope="col">Spieler</th><th scope="col">Saison</th><th scope="col">Gehalt</th><th scope="col">Cap-Anteil</th><th scope="col">→ Preis heute</th><th scope="col">Quelle / Hinweis</th><th scope="col">Prüfung</th></tr></thead><tbody id="contracts-list"></tbody></table></section>
<section id="estimates" aria-labelledby="estimates-title"><div class="section-heading"><h2 id="estimates-title">Schätzwerte Legenden</h2><span class="count" id="estimates-count"></span></div>
<p class="note">TOV, STL und BLK sind Raten pro 36 Minuten. ORB-Anteil ist der Anteil offensiver Rebounds an allen Rebounds. Ein Strich bedeutet: Feld laut Lückenliste nicht benötigt. Die Raten gelten nur für fehlende Saisonwerte. Es handelt sich um Vorschläge zur Freigabe.</p>
<table><thead><tr><th scope="col">Spieler</th><th scope="col">TOV / 36</th><th scope="col">ORB-Anteil</th><th scope="col">STL / 36</th><th scope="col">BLK / 36</th><th scope="col">Begründung / Quellen</th><th scope="col">Prüfung</th></tr></thead><tbody id="estimates-list"></tbody></table></section>
<footer>Quellen öffnen in einem neuen Tab. Änderungen bleiben bis zum Neuladen im Browser. Zum Übernehmen den kopierten Text in den Chat einfügen.</footer>
</main>
<script>
const data = ${data};
const rows = [];
const element = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
const number = (value, digits = 2) => value.toLocaleString('de-DE', {minimumFractionDigits:digits, maximumFractionDigits:digits});
const percent = value => number(value * 100) + ' %';
function cell(row, label, text, className) {
  const td = element('td',className,text); td.dataset.label = label; row.append(td); return td;
}
function identity(row, player) {
  row.dataset.id = player.id;
  const td = cell(row,'Spieler',undefined,'name');
  td.append(element('span','',player.name),element('span','id',player.id));
}
function links(parent, urls) {
  const group = element('div','sources');
  urls.forEach((url,index) => {
    try {
      const parsed = new URL(url);
      if (!['https:','http:'].includes(parsed.protocol)) return;
      const link = element('a','',urls.length === 1 ? 'Quelle' : 'Quelle ' + (index + 1));
      link.href = parsed.href; link.target = '_blank'; link.rel = 'noopener noreferrer';
      group.append(link);
    } catch { /* Ungültige Quellen bleiben ohne anklickbaren Link. */ }
  });
  parent.append(group);
}
function review(row, player, kind) {
  const td = cell(row,'Prüfung',undefined,'review');
  const label = element('label','check');
  const check = element('input'); check.type = 'checkbox'; check.checked = true;
  check.setAttribute('aria-label',player.name + ': ' + kind + ' passt');
  label.append(check,document.createTextNode('passt'));
  const id = kind + '-' + player.id;
  const caption = element('label','correction-label','Korrektur'); caption.htmlFor = id;
  const correction = element('textarea'); correction.id = id; correction.rows = 2;
  correction.setAttribute('aria-label',player.name + ': Korrektur ' + kind);
  td.append(label,caption,correction);
  rows.push({id:player.id,kind,check,correction});
  const clear = () => { document.getElementById('status').textContent = ''; document.getElementById('copy-text').hidden = true; };
  check.addEventListener('change',clear); correction.addEventListener('input',clear);
}
for (const player of data.contracts) {
  const row = element('tr'); identity(row,player);
  const contract = player.contract;
  const cap = contract && data.caps[contract.season];
  const share = contract && cap > 0 ? contract.salary / cap : null;
  const note = contract?.note || player.report?.note || '';
  const uncertain = !contract || share === null || /unsicher/i.test(note);
  if (uncertain) row.classList.add('uncertain');
  const season = contract ? (contract.season - 1) + '/' + String(contract.season).slice(-2) : '—';
  cell(row,'Saison',season,'numeric');
  cell(row,'Gehalt',contract ? number(contract.salary,0) + ' $' : '—','numeric');
  cell(row,'Cap-Anteil',share === null ? (contract ? 'Cap nicht verfügbar' : '—') : percent(share),'numeric');
  cell(row,'→ Preis heute',!contract ? 'Marktwert-Stufe nach Tier' : share === null ? 'Nicht berechenbar' : number(Math.min(0.35,share) * 164.961) + ' Mio. $','numeric');
  const info = cell(row,'Quelle / Hinweis',undefined,'explanation');
  if (contract?.team) info.append(element('div','note',contract.team));
  info.append(element('div','',note || (contract ? '—' : 'Kein belastbares Jahresmaximum belegt.')));
  if (uncertain) info.append(element('span','badge',contract ? 'Unsicher · bitte prüfen' : 'Offen · Marktwert-Stufe nach Tier'));
  links(info,[contract?.source || player.report?.source].filter(Boolean));
  review(row,player,'Gehalt'); document.getElementById('contracts-list').append(row);
}
for (const player of data.estimates) {
  const row = element('tr'); identity(row,player);
  if (/unsicher/i.test(player.reason)) row.classList.add('uncertain');
  for (const [key,label] of [['tovPer36','TOV / 36'],['orbShare','ORB-Anteil'],['stlPer36','STL / 36'],['blkPer36','BLK / 36']]) {
    const value = player[key];
    cell(row,label,value === null ? '— (nicht benötigt)' : key === 'orbShare' ? percent(value) : number(value,1),'numeric');
  }
  const info = cell(row,'Begründung / Quellen',player.reason,'explanation');
  if (/unsicher/i.test(player.reason)) info.append(element('span','badge','Unsicher · bitte prüfen'));
  links(info,player.sources); review(row,player,'Schätzwerte'); document.getElementById('estimates-list').append(row);
}
document.getElementById('contracts-count').textContent = data.contracts.length + ' Spieler';
document.getElementById('estimates-count').textContent = data.estimates.length + ' Spieler';
document.getElementById('theme').addEventListener('click',() => {
  const root = document.documentElement;
  const dark = root.dataset.theme ? root.dataset.theme === 'dark' : window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = dark ? 'light' : 'dark';
});
document.getElementById('copy').addEventListener('click',async () => {
  const changes = rows.flatMap(row => {
    const correction = row.correction.value.trim().replace(/\\s+/g,' ');
    return !row.check.checked || correction ? [row.id + ': ' + row.kind + ': ' + (correction || 'bitte prüfen (passt abgewählt)')] : [];
  });
  const text = changes.length ? 'DATEN-KORREKTUREN\\n' + changes.join('\\n') : 'DATEN-KORREKTUREN keine';
  const fallback = document.getElementById('copy-text'); fallback.value = text;
  try {
    await navigator.clipboard.writeText(text); fallback.hidden = true;
    document.getElementById('status').textContent = 'Kopiert. Jetzt in den Chat einfügen.';
  } catch {
    fallback.hidden = false; fallback.focus(); fallback.select();
    document.getElementById('status').textContent = 'Bitte den markierten Text manuell kopieren und in den Chat einfügen.';
  }
});
</script>
</body>
</html>`;
}

module.exports = { renderPoolHtml, renderDataHtml };
if (require.main === module) {
  const [, , mode, target] = process.argv;
  if (!["pool", "daten"].includes(mode) || !target) {
    console.error("Aufruf: node scripts/review-html.cjs <pool|daten> <zieldatei>");
    process.exitCode = 1;
  } else {
    const read = path => readFileSync(resolve(__dirname, "..", path), "utf8");
    const json = path => JSON.parse(read(path));
    const html = mode === "pool" ? renderPoolHtml(json(".superpowers/pool-vorschlag.json")) : renderDataHtml({
      players: json(".superpowers/pre2000-liste.json"),
      contracts: json("data/manual/contracts-pre2000.json"),
      salaryCap: json("data/manual/salary-cap.json"),
      estimates: json("data/manual/estimates.json"),
      contractReport: read("data/manual/contracts-pre2000-bericht.md"),
    });
    writeFileSync(target, html, "utf8");
    console.log(`${mode === "pool" ? "Pool" : "Daten"}-Klickliste geschrieben: ${resolve(target)}`);
  }
}
