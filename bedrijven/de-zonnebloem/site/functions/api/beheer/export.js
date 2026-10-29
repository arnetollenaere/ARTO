// GET /api/beheer/export: alle bestellingen als CSV (opent in Excel).
export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare("SELECT * FROM bestellingen ORDER BY id").all();
  // Aanhalingstekens verdubbelen en formules onschadelijk maken (Excel voert "=..." anders uit).
  const veld = (v) => {
    let s = String(v ?? "");
    if (/^[=@\t\r]/.test(s) || (/^[+-][^\d\s]/.test(s) && !/^\+\+\+\d/.test(s))) s = "'" + s;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const kop = ["Nummer", "Datum", "Status", "Naam", "E-mail", "Telefoon", "Levering", "Afhaalmoment", "Adres", "Postcode", "Gemeente", "Wijnen", "Flessen", "Totaal (EUR)", "Mededeling", "Betaald op", "Opmerking klant", "Notitie beheer"];
  const lijnen = results.map((r) => [
    r.nummer, r.aangemaakt.slice(0, 10), r.status, r.naam, r.email, r.telefoon, r.levering, r.afhaalmoment, r.adres, r.postcode, r.gemeente,
    JSON.parse(r.regels).map((x) => `${x.aantal}x ${x.naam}`).join(", "), r.flessen, (r.totaal / 100).toFixed(2).replace(".", ","),
    r.ogm, (r.betaald_op || "").slice(0, 10), r.opmerking, r.notitie_beheer,
  ].map(veld).join(";"));
  const csv = "﻿" + [kop.map(veld).join(";"), ...lijnen].join("\r\n");
  return new Response(csv, {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="bestellingen-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}
