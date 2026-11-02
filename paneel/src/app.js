"use strict";
// ARTO-controlepaneel. Leest data.json (gemaakt door build.mjs) en /api/status (Pages Function).

const $app = document.getElementById("app");
let DATA = null;
let STATUS = {}; // domein -> resultaat
let statusBezig = false;

const STATUSSEN = ["offerte", "in opbouw", "online", "overgedragen", "gestopt"];

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function leeg(w) { return !w || /in te vullen/i.test(w); }
function cls(s) { return String(s).toLowerCase().replace(/\s+/g, "-"); }
function pil(tekst, soort) { return `<span class="pil ${esc(cls(soort ?? tekst))}">${esc(tekst)}</span>`; }

function ghBestand(pad) { return `${DATA.repo}/blob/${encodeURIComponent(DATA.branch).replace(/%2F/g, "/")}/${pad}`; }
function repoUrl(w) {
  if (leeg(w)) return "";
  const m = String(w).match(/github\.com\/([^/\s]+\/[^/\s)]+)/) || String(w).match(/^([\w.-]+\/[\w.-]+)$/);
  return m ? `https://github.com/${m[1].replace(/\.git$/, "")}` : "";
}
function waarde(w) {
  if (leeg(w)) return `<span class="leeg">${w ? esc(w) : "leeg"}</span>`;
  const t = esc(w);
  return t.replace(/\b([\w.+-]+@[\w-]+\.[\w.-]+)\b/g, '<a href="mailto:$1">$1</a>')
          .replace(/\b(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
}

function toast(t) {
  const el = document.getElementById("toast");
  el.textContent = t; el.classList.add("zichtbaar");
  clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("zichtbaar"), 1800);
}
async function kopieer(tekst) {
  try { await navigator.clipboard.writeText(tekst); toast("Gekopieerd. Plak het in Claude."); }
  catch { prompt("Kopieer deze opdracht:", tekst); }
}

function laatsteLog(k) { return k.logboek[0] || null; }

function statusCel(domein) {
  if (!domein) return `<span class="klein">geen domein</span>`;
  const s = STATUS[domein];
  if (!s) return statusBezig ? `<span class="klein">controleren…</span>` : `<span class="klein">nog niet gecontroleerd</span>`;
  if (s.fout === "api") return `<span class="klein">niet beschikbaar</span>`;
  if (!s.ok) return pil(s.status ? `fout ${s.status}` : "onbereikbaar", "fout");
  return s.ms > 2000 ? pil(`traag · ${s.ms} ms`, "traag") : pil(`ok · ${s.ms} ms`, "ok");
}

async function controleerSites(domein) {
  statusBezig = true; render();
  try {
    const res = await fetch(`/api/status${domein ? `?domein=${encodeURIComponent(domein)}` : ""}`, { cache: "no-store" });
    if (!res.ok) throw new Error(res.status);
    const j = await res.json();
    for (const r of j.resultaten) STATUS[r.domein] = r;
  } catch {
    for (const k of DATA.klanten) if (k.domein && (!domein || k.domein === domein)) STATUS[k.domein] = { fout: "api" };
    toast("Statuscontrole werkt alleen op Cloudflare.");
  }
  statusBezig = false; render();
}

// ---------- Overzicht ----------
let filter = { zoek: "", status: "" };

function overzicht() {
  const ks = DATA.klanten;
  const online = ks.filter((k) => k.status === "online").length;
  const open = ks.reduce((s, k) => s + k.open.length, 0);
  const logs = ks.flatMap((k) => k.logboek.map((l) => ({ ...l, klant: k }))).sort((a, b) => b.datum.localeCompare(a.datum));
  const gecontroleerd = Object.values(STATUS).filter((s) => s.fout !== "api");
  const bereikbaar = gecontroleerd.filter((s) => s.ok).length;

  const zichtbaar = ks.filter((k) =>
    (!filter.status || k.status === filter.status) &&
    (!filter.zoek || `${k.naam} ${k.titel} ${k.domein} ${k.velden.Basis?.Sector ?? ""}`.toLowerCase().includes(filter.zoek.toLowerCase())));

  const rijen = zichtbaar.map((k) => {
    const l = laatsteLog(k);
    return `<tr class="klik" data-klant="${esc(k.slug)}">
      <td><div class="naam">${esc(k.titel)}</div><div class="klein">${esc(k.velden.Basis?.Sector ?? "")}</div></td>
      <td>${pil(k.status)}</td>
      <td>${k.domein ? `<a href="https://${esc(k.domein)}" target="_blank" rel="noopener" data-stop>${esc(k.domein)}</a>` : `<span class="leeg">geen</span>`}</td>
      <td>${statusCel(k.domein)}</td>
      <td class="num">${k.open.length ? `<span class="leeg">${k.open.length}</span>` : "0"}</td>
      <td class="verberg-smal klein">${l ? `${esc(l.datum)}` : ""}</td>
    </tr>`;
  }).join("") || `<tr><td colspan="6" class="klein">Geen klanten gevonden.</td></tr>`;

  return `
    <div class="kop">
      <div><h1>Overzicht</h1><p>Alle klanten en sites van ARTO.</p></div>
      <div class="knoppen">
        <button class="knop" data-actie="controleer" ${statusBezig ? "disabled" : ""}>${statusBezig ? "Bezig…" : "Controleer alle sites"}</button>
        <button class="knop primair" data-kopieer="Maak een nieuwe klant aan: ">Nieuwe klant</button>
      </div>
    </div>
    <section class="kpis">
      <div class="kpi"><div class="label">Klanten</div><div class="waarde">${ks.length}</div><div class="extra">${STATUSSEN.map((s) => `${ks.filter((k) => k.status === s).length} ${s}`).filter((t) => !t.startsWith("0")).join(" · ")}</div></div>
      <div class="kpi"><div class="label">Online</div><div class="waarde">${online}</div><div class="extra">sites in onderhoud</div></div>
      <div class="kpi"><div class="label">Bereikbaar</div><div class="waarde">${gecontroleerd.length ? `${bereikbaar}/${gecontroleerd.length}` : "–"}</div><div class="extra">${gecontroleerd.length ? "bij laatste controle" : "nog niet gecontroleerd"}</div></div>
      <div class="kpi"><div class="label">Open punten</div><div class="waarde">${open}</div><div class="extra">ontbrekende gegevens in fiches</div></div>
    </section>
    <section class="paneel">
      <div class="paneel-kop">
        <h2>Klanten</h2>
        <div class="zoek">
          <input type="search" id="zoek" placeholder="Zoek klant of domein" value="${esc(filter.zoek)}" aria-label="Zoek klant">
          <select id="statusfilter" aria-label="Filter op status"><option value="">Alle statussen</option>${STATUSSEN.map((s) => `<option ${filter.status === s ? "selected" : ""}>${s}</option>`).join("")}</select>
        </div>
      </div>
      <div class="scroll"><table>
        <thead><tr><th>Klant</th><th>Status</th><th>Domein</th><th>Site</th><th>Open</th><th class="verberg-smal">Laatst</th></tr></thead>
        <tbody>${rijen}</tbody>
      </table></div>
    </section>
    <section class="paneel">
      <div class="paneel-kop"><h2>Recente activiteit</h2></div>
      <div class="scroll"><table>
        <thead><tr><th>Datum</th><th>Klant</th><th>Wat</th><th class="verberg-smal">Gepubliceerd</th></tr></thead>
        <tbody>${logs.slice(0, 10).map((l) => `<tr><td class="num klein">${esc(l.datum)}</td><td><a href="#/klant/${esc(l.klant.slug)}">${esc(l.klant.titel)}</a></td><td>${esc(l.wat)}</td><td class="verberg-smal klein">${esc(l.gepubliceerd)}</td></tr>`).join("") || `<tr><td colspan="4" class="klein">Nog geen logboek.</td></tr>`}</tbody>
      </table></div>
    </section>`;
}

// ---------- Klant ----------
function taken(k) {
  const n = k.titel;
  return [
    { titel: "Hele site optimaliseren", uitleg: "Snelheid, SEO, toegankelijkheid en techniek. Meet voor en na en schrijft een rapport in het logboek.", prompt: `Optimaliseer de site van ${n}.`, hoofd: true },
    { titel: "Iets aanpassen", uitleg: "Tekst, foto, pagina, openingsuren of kleuren.", prompt: `Verander op de site van ${n}: ` },
    { titel: "Preview maken", uitleg: "Zet een testversie op een aparte URL.", prompt: `Maak een preview van de site van ${n}.` },
    { titel: "Publiceren", uitleg: "Zet de laatste versie live op Cloudflare Pages.", prompt: `Publiceer de site van ${n} naar productie.` },
    { titel: "Open punten invullen", uitleg: "Vul de ontbrekende gegevens in de fiche aan.", prompt: `Vul de ontbrekende gegevens in de fiche van ${n} aan.` },
    { titel: "Overdragen", uitleg: "Code, toegang en overdrachtsdocument voor de klant.", prompt: `Draag de site van ${n} over aan de klant.` },
  ];
}

function klant(slug) {
  const k = DATA.klanten.find((x) => x.slug === slug);
  if (!k) return `<a class="terug" href="#/">← Overzicht</a><h1>Klant niet gevonden</h1>`;
  const d = k.domein;
  const repo = repoUrl(k.velden.Website?.Repo);
  const s = STATUS[d];
  const links = [
    d && `<a class="knop" href="https://${esc(d)}" target="_blank" rel="noopener">Open site</a>`,
    repo && `<a class="knop" href="${esc(repo)}" target="_blank" rel="noopener">Code op GitHub</a>`,
    `<a class="knop" href="https://dash.cloudflare.com/" target="_blank" rel="noopener">Cloudflare</a>`,
    `<a class="knop" href="${esc(ghBestand(`bedrijven/${k.slug}/bedrijf.md`))}" target="_blank" rel="noopener">Fiche bewerken</a>`,
  ].filter(Boolean).join("");

  const sectiesHtml = Object.entries(k.velden).map(([sectie, velden]) => `
    <section class="paneel"><div class="paneel-kop"><h2>${esc(sectie)}</h2></div><div class="inhoud">
      <dl class="velden">${Object.entries(velden).map(([n, w]) => `<dt>${esc(n)}</dt><dd>${waarde(w)}</dd>`).join("")}</dl>
    </div></section>`).join("");

  const afspraken = k.afspraken.length ? `<section class="paneel"><div class="paneel-kop"><h2>Afspraken</h2></div><div class="inhoud"><dl class="velden">${k.afspraken.map((a) => `<dt>${esc(a.veld)}</dt><dd>${waarde(a.waarde)}</dd>`).join("")}</dl></div></section>` : "";
  const notities = k.notities.length ? `<section class="paneel"><div class="paneel-kop"><h2>Notities</h2></div><div class="inhoud"><ul class="lijst">${k.notities.map((n) => `<li>${waarde(n)}</li>`).join("")}</ul></div></section>` : "";
  const logboek = `<section class="paneel"><div class="paneel-kop"><h2>Logboek</h2><a class="klein" href="${esc(ghBestand(`bedrijven/${k.slug}/logboek.md`))}" target="_blank" rel="noopener">Op GitHub</a></div>
    <div class="scroll"><table><thead><tr><th>Datum</th><th>Wat</th><th class="verberg-smal">Gepubliceerd</th></tr></thead>
    <tbody>${k.logboek.map((l) => `<tr><td class="num klein">${esc(l.datum)}</td><td>${esc(l.wat)}</td><td class="verberg-smal klein">${esc(l.gepubliceerd)}</td></tr>`).join("") || `<tr><td colspan="3" class="klein">Nog leeg.</td></tr>`}</tbody></table></div></section>`;

  const statusBlok = d ? `<section class="paneel"><div class="paneel-kop"><h2>Site</h2><button class="knop" data-actie="controleer" data-domein="${esc(d)}" ${statusBezig ? "disabled" : ""}>${statusBezig ? "Bezig…" : "Controleer"}</button></div>
    <div class="inhoud status-detail">
      <div><span>Status</span><span>${statusCel(d)}</span></div>
      ${s && s.fout !== "api" ? `
        <div><span>HTTP</span><span class="num">${esc(s.status || "–")}</span></div>
        <div><span>Laadtijd HTML</span><span class="num">${esc(s.ms)} ms</span></div>
        ${s.eindUrl ? `<div><span>Eindadres</span><span>${esc(s.eindUrl)}</span></div>` : ""}
        ${s.ok ? `<div><span>Via Cloudflare</span><span>${s.cloudflare ? "ja" : "nee"}</span></div>
        <div><span>Titel</span><span>${esc(s.titel || "geen")}</span></div>
        <div><span>Meta description</span><span>${s.metaDescription ? "ja" : `<span class="leeg">ontbreekt</span>`}</span></div>
        <div><span>Grootte HTML</span><span class="num">${Math.round((s.bytes || 0) / 1024)} kB</span></div>` : ""}
        ${s.fout ? `<div><span>Fout</span><span>${esc(s.fout)}</span></div>` : ""}` : ""}
    </div></section>` : "";

  const meten = d ? `<div class="knoppen meten">
      <a class="knop" href="https://pagespeed.web.dev/analysis?url=${encodeURIComponent(`https://${d}/`)}" target="_blank" rel="noopener">PageSpeed</a>
      <a class="knop" href="https://securityheaders.com/?q=${encodeURIComponent(d)}&followRedirects=on" target="_blank" rel="noopener">Beveiliging</a>
      <a class="knop" href="https://validator.w3.org/nu/?doc=${encodeURIComponent(`https://${d}/`)}" target="_blank" rel="noopener">HTML-validatie</a>
    </div>` : "";

  const takenHtml = taken(k).map((t) => `<div class="taak">
      <h3>${esc(t.titel)}</h3><p>${esc(t.uitleg)}</p>
      <div class="prompt"><code title="${esc(t.prompt)}">${esc(t.prompt)}</code><button class="knop ${t.hoofd ? "primair" : ""}" data-kopieer="${esc(t.prompt)}">Kopieer</button></div>
      ${t.hoofd ? meten : ""}
    </div>`).join("");

  return `
    <a class="terug" href="#/">← Overzicht</a>
    <div class="kop">
      <div><h1>${esc(k.titel)}</h1><p>${pil(k.status)} ${d ? `&nbsp;${esc(d)}` : ""}</p></div>
      <div class="knoppen">${links}</div>
    </div>
    <div class="raster">
      <div>${sectiesHtml}${afspraken}${notities}${logboek}</div>
      <aside>
        ${statusBlok}
        <section class="paneel"><div class="paneel-kop"><h2>Met Claude</h2></div><div class="inhoud taken">${takenHtml}</div></section>
        <section class="paneel"><div class="paneel-kop"><h2>Open punten (${k.open.length})</h2></div><div class="inhoud">
          ${k.open.length ? `<ul class="open">${k.open.map((o) => `<li>${esc(o)}</li>`).join("")}</ul>` : `<p class="klein">Alles ingevuld.</p>`}
        </div></section>
      </aside>
    </div>`;
}

// ---------- Werkwijze ----------
function werkwijze() {
  const proc = [
    ["Nieuwe klant", "Bedrijfsmap, fiche en een nieuwe site vanuit een template.", "setup/nieuwe-klant.md", "Maak een nieuwe klant aan: "],
    ["Hosting en domein", "Cloudflare-account van de klant, Pages-project, domein koppelen.", "setup/hosting-cloudflare.md", "Publiceer de site van "],
    ["Optimalisatie", "Checklist voor snelheid, SEO, toegankelijkheid en techniek.", "setup/optimalisatie.md", "Optimaliseer de site van "],
    ["Overdracht", "Code, toegang en document wanneer een klant vertrekt.", "setup/overdracht.md", "Draag de site van ... over aan de klant."],
    ["Accounts", "Welke accounts ARTO zelf nodig heeft.", "setup/accounts.md", ""],
    ["Werkplek", "Tools op je computer: git, Node.js, Wrangler, Claude Code.", "setup/werkplek.md", ""],
  ];
  const sjablonen = [
    ["Klantfiche", "setup/sjablonen/bedrijf/bedrijf.md"],
    ["Offerte", "setup/sjablonen/documenten/offerte.md"],
    ["Overdrachtsdocument", "setup/sjablonen/documenten/overdracht.md"],
    ["Websitetemplates", "templates/README.md"],
  ];
  return `
    <div class="kop"><div><h1>Werkwijze</h1><p>Vaste procedures, sjablonen en opdrachten voor Claude.</p></div>
      <div class="knoppen"><button class="knop" data-kopieer="Geef me een overzicht van alle klanten.">Kopieer: overzicht</button></div></div>
    <section class="paneel"><div class="paneel-kop"><h2>Procedures</h2></div><div class="inhoud kaarten">
      ${proc.map(([t, u, pad, p]) => `<div class="kaart"><h3>${esc(t)}</h3><p>${esc(u)}</p><div class="knoppen">
        <a class="knop" href="${esc(ghBestand(pad))}" target="_blank" rel="noopener">Lees</a>
        ${p ? `<button class="knop" data-kopieer="${esc(p)}">Kopieer opdracht</button>` : ""}</div></div>`).join("")}
    </div></section>
    <section class="paneel"><div class="paneel-kop"><h2>Sjablonen</h2></div><div class="inhoud kaarten">
      ${sjablonen.map(([t, pad]) => `<div class="kaart"><h3>${esc(t)}</h3><p><code>${esc(pad)}</code></p><a class="knop" href="${esc(ghBestand(pad))}" target="_blank" rel="noopener">Open</a></div>`).join("")}
    </div></section>
    <section class="paneel"><div class="paneel-kop"><h2>Snel naar</h2></div><div class="inhoud knoppen">
      <a class="knop" href="${esc(DATA.repo)}" target="_blank" rel="noopener">ARTO-repo</a>
      <a class="knop" href="https://dash.cloudflare.com/" target="_blank" rel="noopener">Cloudflare-dashboard</a>
      <a class="knop" href="https://one.dash.cloudflare.com/" target="_blank" rel="noopener">Cloudflare Zero Trust</a>
      <a class="knop" href="https://claude.ai/code" target="_blank" rel="noopener">Claude Code</a>
      <a class="knop" href="https://artowebdesign.com" target="_blank" rel="noopener">artowebdesign.com</a>
    </div></section>`;
}

// ---------- Router ----------
function render() {
  if (!DATA) return;
  const h = location.hash.replace(/^#/, "") || "/";
  const m = h.match(/^\/klant\/([\w-]+)/);
  const pagina = m ? "klant" : h.startsWith("/werkwijze") ? "werkwijze" : "overzicht";
  const zoekFocus = document.activeElement?.id === "zoek";
  const pos = zoekFocus ? document.activeElement.selectionStart : 0;
  $app.innerHTML = pagina === "klant" ? klant(m[1]) : pagina === "werkwijze" ? werkwijze() : overzicht();
  document.querySelectorAll("[data-nav]").forEach((a) => a.classList.toggle("actief", a.dataset.nav === pagina || (pagina === "klant" && a.dataset.nav === "overzicht")));
  const k = m && DATA.klanten.find((x) => x.slug === m[1]);
  document.title = k ? `${k.titel} · ARTO paneel` : pagina === "werkwijze" ? "Werkwijze · ARTO paneel" : "ARTO paneel";
  if (zoekFocus) { const z = document.getElementById("zoek"); z.focus(); z.setSelectionRange(pos, pos); }
}

document.addEventListener("click", (e) => {
  const kop = e.target.closest("[data-kopieer]");
  if (kop) { kopieer(kop.dataset.kopieer); return; }
  const act = e.target.closest("[data-actie=controleer]");
  if (act) { controleerSites(act.dataset.domein); return; }
  if (e.target.closest("a, [data-stop]")) return;
  const rij = e.target.closest("tr[data-klant]");
  if (rij) location.hash = `#/klant/${rij.dataset.klant}`;
});
document.addEventListener("input", (e) => {
  if (e.target.id === "zoek") { filter.zoek = e.target.value; render(); }
  if (e.target.id === "statusfilter") { filter.status = e.target.value; render(); }
});
window.addEventListener("hashchange", () => { render(); window.scrollTo(0, 0); });

(async function start() {
  try {
    const res = await fetch("data.json", { cache: "no-store" });
    DATA = await res.json();
  } catch {
    $app.innerHTML = `<h1>Kon de gegevens niet laden</h1><p class="klein">data.json ontbreekt. Bouw het paneel opnieuw met <code>node build.mjs</code>.</p>`;
    return;
  }
  document.getElementById("voet").innerHTML = `Gebouwd op ${esc(new Date(DATA.gebouwd).toLocaleString("nl-BE"))} uit <a href="${esc(DATA.repo)}/tree/${esc(DATA.branch)}" target="_blank" rel="noopener">${esc(DATA.branch)}</a>${DATA.commit ? ` @ ${esc(DATA.commit)}` : ""}. Gegevens wijzigen doe je in <code>bedrijven/&lt;klant&gt;/bedrijf.md</code>.`;
  render();
  controleerSites();
})();
