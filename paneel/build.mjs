// Bouwt het ARTO-controlepaneel naar dist/.
// Leest alle klantfiches in ../bedrijven/ en zet ze in dist/data.json.
// Gebruik: node build.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, rmSync, cpSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const hier = dirname(fileURLToPath(import.meta.url));
const root = join(hier, "..");
const bedrijvenDir = join(root, "bedrijven");
const dist = join(hier, "dist");

const ONTBREEKT = /in te vullen|^\s*$/i;
// Velden die per klant ingevuld moeten zijn (voor de lijst "open punten").
const VERPLICHT = {
  Basis: ["Status", "Klant sinds", "Sector"],
  Contact: ["Contactpersoon", "E-mail", "Telefoon", "Adres"],
  Website: ["Domein", "Repo", "Site staat in", "Live sinds"],
  "Hosting en toegang": ["Domein geregistreerd bij", "Domein op naam van", "Cloudflare-account van", "Arne uitgenodigd als Administrator", "Cloudflare Pages-project"],
};

function tabel(regels) {
  const rijen = regels
    .filter((r) => r.trim().startsWith("|"))
    .map((r) => r.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()))
    .filter((c) => !c.every((x) => /^:?-+:?$/.test(x)));
  return { kop: rijen[0] || [], rijen: rijen.slice(1) };
}

function secties(md) {
  const uit = { titel: "", secties: {} };
  let huidig = null;
  for (const regel of md.split("\n")) {
    const h1 = regel.match(/^# (.+)/);
    const h2 = regel.match(/^## (.+)/);
    if (h1 && !uit.titel) uit.titel = h1[1].trim();
    else if (h2) { huidig = h2[1].trim(); uit.secties[huidig] = []; }
    else if (huidig) uit.secties[huidig].push(regel);
  }
  return uit;
}

function lijst(regels) {
  return regels.map((r) => r.match(/^\s*[-*] (.*)/)).filter(Boolean).map((m) => m[1].trim());
}

function leesKlant(slug) {
  const map = join(bedrijvenDir, slug);
  const fiche = secties(readFileSync(join(map, "bedrijf.md"), "utf8"));
  const velden = {};
  for (const [naam, regels] of Object.entries(fiche.secties)) {
    const t = tabel(regels);
    if (t.kop[0] === "Veld") velden[naam] = Object.fromEntries(t.rijen.map((r) => [r[0], r[1] ?? ""]));
  }
  const afspraken = lijst(fiche.secties["Afspraken"] || []).map((a) => {
    const [k, ...v] = a.split(":");
    return { veld: k.trim(), waarde: v.join(":").trim() };
  });
  const notities = lijst(fiche.secties["Notities"] || []);

  const open = [];
  for (const [sectie, namen] of Object.entries(VERPLICHT)) {
    for (const n of namen) {
      const w = velden[sectie]?.[n];
      if (w === undefined || ONTBREEKT.test(w)) open.push(`${sectie}: ${n}`);
    }
  }
  for (const a of afspraken) if (ONTBREEKT.test(a.waarde)) open.push(`Afspraken: ${a.veld}`);

  let logboek = [];
  const logPad = join(map, "logboek.md");
  if (existsSync(logPad)) {
    const t = tabel(readFileSync(logPad, "utf8").split("\n"));
    logboek = t.rijen.map((r) => ({ datum: r[0], wat: r[1], gepubliceerd: r[2] ?? "" }));
  }
  return {
    slug,
    naam: velden.Basis?.Naam || fiche.titel || slug,
    titel: fiche.titel || slug,
    status: (velden.Basis?.Status || "onbekend").toLowerCase(),
    domein: (velden.Website?.Domein || "").replace(/^https?:\/\//, "").replace(/\/.*$/, ""),
    velden,
    afspraken,
    notities,
    open,
    logboek,
  };
}

function git(cmd, standaard) {
  try { return execSync(cmd, { cwd: root, stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); }
  catch { return standaard; }
}

const slugs = readdirSync(bedrijvenDir).filter((d) => statSync(join(bedrijvenDir, d)).isDirectory() && existsSync(join(bedrijvenDir, d, "bedrijf.md")));
const klanten = slugs.map(leesKlant).sort((a, b) => a.naam.localeCompare(b.naam, "nl"));

const branch = process.env.CF_PAGES_BRANCH || process.env.GITHUB_REF_NAME || git("git rev-parse --abbrev-ref HEAD", "main");
const data = {
  gebouwd: new Date().toISOString(),
  repo: "https://github.com/arnetollenaere/ARTO",
  branch,
  commit: git("git rev-parse --short HEAD", ""),
  klanten,
};

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(join(hier, "src"), dist, { recursive: true });
writeFileSync(join(dist, "data.json"), JSON.stringify(data, null, 2));
console.log(`Paneel gebouwd: ${klanten.length} klanten, ${klanten.reduce((s, k) => s + k.open.length, 0)} open punten -> dist/`);
