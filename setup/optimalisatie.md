# Optimalisatie

Wat "de hele site optimaliseren" bij ARTO betekent. De skill `site-optimaliseren` loopt deze lijst af, meet voor en na, en schrijft het resultaat in het logboek van de klant.

## Meten

- **Lighthouse** (in Chrome DevTools, of `npx lighthouse https://domein --view`): scores voor snelheid, toegankelijkheid, best practices en SEO. Doel: overal 90 of hoger.
- **PageSpeed Insights** (https://pagespeed.web.dev): dezelfde meting plus echte gebruikersdata als de site genoeg bezoekers heeft.
- Noteer de scores vóór en na in het logboek.

## Snelheid

- Afbeeldingen in WebP of AVIF, op de juiste maat, met `width` en `height` en `loading="lazy"` (behalve de eerste grote afbeelding).
- Geen ongebruikte CSS of JavaScript. Scripts met `defer`.
- Lettertypes zelf hosten, `font-display: swap`, alleen de gewichten die gebruikt worden.
- Caching via het `_headers`-bestand: lange cache voor `/css/*`, `/img/*`, `/js/*`.

## SEO

- Elke pagina: unieke `<title>` (max. ±60 tekens) en `<meta name="description">` (max. ±155 tekens).
- Eén `<h1>` per pagina, logische koppen daaronder.
- `sitemap.xml` en `robots.txt` aanwezig en kloppend.
- Open Graph-tags (`og:title`, `og:description`, `og:image`) voor mooie previews bij delen.
- Structured data (`LocalBusiness` in JSON-LD) met naam, adres, telefoon, openingsuren.
- Canonieke URL (`<link rel="canonical">`) en één officieel domein (www-redirect).

## Toegankelijkheid

- Alle afbeeldingen een zinvolle `alt` (of `alt=""` als ze decoratief zijn).
- Voldoende kleurcontrast (minstens 4,5:1 voor tekst).
- Alles bereikbaar met het toetsenbord, zichtbare focus.
- `lang="nl"` (of de juiste taal) op `<html>`.
- Formulieren met labels.

## Veiligheid en techniek

- HTTPS overal (Cloudflare doet dit), `Always Use HTTPS` aan.
- Beveiligingsheaders in `_headers` (staan al in de basissite).
- Geen kapotte links (`npx linkinator https://domein`).
- 404-pagina aanwezig.

## Inhoud

- Contactgegevens kloppen met de fiche in `bedrijven/<slug>/bedrijf.md`.
- Copyright-jaar en openingsuren actueel.
