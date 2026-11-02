// Houdt per bestelling bij welke e-mails vertrokken zijn, en de laatste fout.
export async function noteerMail(env, id, kolom, resultaat) {
  try {
    if (resultaat.ok) await env.DB.prepare(`UPDATE bestellingen SET ${kolom} = ?, mail_fout = NULL WHERE id = ?`).bind(new Date().toISOString(), id).run();
    else await env.DB.prepare("UPDATE bestellingen SET mail_fout = ? WHERE id = ?").bind(resultaat.fout, id).run();
  } catch { /* kolommen nog niet aangemaakt: migrations/0003_mails.sql */ }
}

export function bestellingVoorBeheer({ token, ip_hash, ...r }) {
  return { ...r, regels: JSON.parse(r.regels) };
}
