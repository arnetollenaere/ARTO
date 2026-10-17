// Controleert of de klantsites bereikbaar zijn.
// Alleen domeinen uit data.json worden gecontroleerd, zodat dit geen open proxy is.

async function check(domein) {
  const start = Date.now();
  try {
    const res = await fetch(`https://${domein}/`, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": "ARTO-paneel/1.0 (statuscontrole)" },
      signal: AbortSignal.timeout(10000),
    });
    const ms = Date.now() - start;
    const html = res.headers.get("content-type")?.includes("html") ? await res.text() : "";
    const titel = (html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1]?.trim() || "";
    return {
      domein,
      ok: res.ok,
      status: res.status,
      ms,
      eindUrl: res.url,
      server: res.headers.get("server") || "",
      cloudflare: !!res.headers.get("cf-ray"),
      titel,
      metaDescription: /<meta[^>]+name=["']description["']/i.test(html),
      bytes: html.length,
    };
  } catch (e) {
    return { domein, ok: false, status: 0, ms: Date.now() - start, fout: String(e?.message || e) };
  }
}

export async function onRequestGet({ request, env }) {
  const dataRes = await env.ASSETS.fetch(new URL("/data.json", request.url));
  const data = await dataRes.json();
  const gekend = new Set(data.klanten.map((k) => k.domein).filter(Boolean));
  const gevraagd = new URL(request.url).searchParams.get("domein");
  const lijst = gevraagd ? [gevraagd].filter((d) => gekend.has(d)) : [...gekend];
  const resultaten = await Promise.all(lijst.map(check));
  return Response.json({ gecontroleerd: new Date().toISOString(), resultaten }, { headers: { "Cache-Control": "no-store" } });
}
