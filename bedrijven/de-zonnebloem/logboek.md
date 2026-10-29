# Logboek De Zonnebloem

Nieuwste bovenaan. Eén regel per gebeurtenis: datum, wat er gebeurde, en of het gepubliceerd is.

| Datum | Wat | Gepubliceerd |
|---|---|---|
| 2026-10-29 | Animatie: voortgangsbalk weg, tekst gecentreerd eronder, kleine pauzeknop, verticaal in het midden van het scherm. | preview |
| 2026-10-29 | Groot Raakpunt-logo in het openingsbeeld verwijderd (enkel nog het logo in de kop), titel groter. | preview |
| 2026-10-29 | Enkel afhalen: levering aan huis uitgezet (site en server), teksten aangepast. | preview |
| 2026-10-29 | Volledig omgezet naar de huisstijl van vzwraakpunt.be (blauw #2832b9, oranje #ff4619, Antonio + Cantarell, Raakpunt-logo, hamburgermenu, oranje voettekst). Animatie behouden. Donkere versie bewaard: branch `versie-donker` in de site-repo, `claude/de-zonnebloem-versie-donker` in ARTO, online op versie-donker.de-zonnebloem.pages.dev. | preview (e7244091.de-zonnebloem.pages.dev) |
| 2026-10-29 | Live gezet: snellere animatie met afgestemd openingsbeeld en de inhoud over vzw Raakpunt. IBAN is nog een voorbeeld. | productie |
| 2026-10-29 | Echte inhoud over vzw Raakpunt en De Zonnebloem toegevoegd (werking, motto, activiteiten, e-mail, ondernemingsnummer), begunstigde vzw Raakpunt, domein tijdelijk ingevuld als de-zonnebloem.pages.dev. | preview |
| 2026-10-29 | Animatie sneller (~14 s per ronde). Openingsbeeld afgestemd: gloed over het hele beeld in de kleur van elke stap, goudstof over het hele beeld, knop en balken kleuren mee. | preview (769f70ef.de-zonnebloem.pages.dev) |
| 2026-10-29 | Live gezet: deeltjesanimatie + beveiliging betaalgegevens (IBAN-controle, optionele vingerafdruk IBAN_SHA256, statusmelding in beheer, IBAN-check in deploy.sh, HSTS/COOP/strengere CSP, max. 5 bestellingen per bezoeker per uur). Databasemigratie 0002_ip_hash toegepast. Testbestelling geplaatst en geannuleerd. IBAN is nog een voorbeeld; vingerafdruk nog niet ingesteld. | productie |
| 2026-10-29 | Openingsanimatie vervangen door een deeltjesanimatie op canvas (glas wijn, muntstuk, zonnebloem, twee vrienden) met 3D-diepte, golvende wijn en interactie met muis of vinger. | preview (20feddda.de-zonnebloem.pages.dev) |
| 2026-10-29 | Wijnglasfoto in het openingsbeeld vervangen door een geanimeerd verhaal (glas vult zich, druppels worden muntjes, zonnebloem groeit, twee vrienden van wie één in een rolstoel). Volwassen figuren, geen kinderen naast wijn (Belgische alcoholreclameregels). | preview (8b4b989c.de-zonnebloem.pages.dev) |
| 2026-10-29 | Live gezet: donkere fotostijl met Libre Franklin en bewegende elementen, zonder scroll-lijntje. | productie |
| 2026-10-29 | Scroll-lijntje onder de teller verwijderd, kop uitgelijnd met de openingstekst op brede schermen. | preview (a58adb1f.de-zonnebloem.pages.dev) |
| 2026-10-29 | Lettertype Libre Franklin, door Arne gekozen uit vier voorbeelden (Libre Caslon, EB Garamond, Alegreya, Libre Franklin). | preview (cd5c494e.de-zonnebloem.pages.dev) |
| 2026-10-29 | Donkere fotostijl teruggezet op vraag van Arne, met Source Sans 3, gewone teksten en bewegende elementen (onthullingen, parallax, teller, oplichtende tekst, melding bij toevoegen aan mandje). Zonder goudlijntjes, Romeinse cijfers, citaat en lopende band. | preview (352deb0c.de-zonnebloem.pages.dev) |
| 2026-10-29 | Sobere versie live gezet op https://de-zonnebloem.pages.dev. | productie |
| 2026-10-29 | Sober ontwerp op vraag van Arne: enkel Source Sans 3, sierelementen en animaties weg, gewone titel ("Wijnverkoop ten voordele van De Zonnebloem") en uitleg. | preview (e05bac8e.de-zonnebloem.pages.dev) |
| 2026-10-29 | Live gezet op https://de-zonnebloem.pages.dev in Arnes Cloudflare-account: Pages-project `de-zonnebloem`, D1-database `zonnebloem-bestellingen-eu`, beheerwachtwoord als secret. Testbestelling ZB-2026-0001 geplaatst en geannuleerd. Let op: IBAN, wijnen, prijzen, afhaaladres en contactgegevens zijn nog voorbeelden. | productie |
| 2026-10-29 | Lettertypes vervangen op vraag van Arne: Bodoni Moda (titels) en Jost (tekst), beide zelf gehost (OFL-licentie). Minder gespatieerde hoofdletters. | nee |
| 2026-10-29 | Nieuw ontwerp op vraag van Arne: illustraties vervangen door professionele foto's (Unsplash, bronnen in `site/FOTOS.md`), donkere editoriale stijl met grote typografie, beeldonthullingen, parallax en scroll-animaties. Bestelflow en beheer ongewijzigd, opnieuw getest. | nee |
| 2026-10-29 | Webshop gebouwd vanuit `site-basis`: wijnkatalogus met getekende flessen, mandje, bestelformulier (afhalen/levering), bevestigingspagina met gestructureerde mededeling en EPC-QR, beheerscherm (status, betalingen afpunten, picklijst, Excel-export). Lokaal getest. Wijnen, prijzen, IBAN en contactgegevens zijn nog voorbeelden. | nee |
| 2026-10-29 | Klant aangemaakt in ARTO. | n.v.t. |
