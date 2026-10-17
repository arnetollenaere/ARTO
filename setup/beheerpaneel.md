# Beheerpaneel

Elke site die gemaakt is vanuit een sectortemplate (horeca, kapper, bouw, advies, fitness, winkel, creatief, zorg) heeft hetzelfde beheerpaneel op `https://<domein>/beheer/`. Daar kan de klant (of jij) zonder code:

- alle teksten, prijzen, diensten, team, openingsuren, contactgegevens en sociale media aanpassen, met **live preview** (klik in de preview op een tekst om ze te bewerken);
- foto's uploaden (ze worden in de browser automatisch verkleind en naar WebP omgezet);
- titels en beschrijvingen voor Google instellen, met een voorbeeld van het zoekresultaat en van de deelkaart op WhatsApp en Facebook;
- de **hele site laten doorlichten en optimaliseren**: snelheid, vindbaarheid, toegankelijkheid en inhoud, met één knop "Optimaliseer alles";
- berichten van het contactformulier lezen;
- elke vorige versie bekijken, vergelijken en terugzetten;
- de themakleuren aanpassen.

## Hoe het werkt

```
klant ─ /beheer/ ─ /api/inhoud ─ commit van inhoud.json in de GitHub-repo van de site
                                            │
                       GitHub Action "Publiceren" ─ ./build.sh ─ Cloudflare Pages (± 1 minuut)
```

- Het paneel en de API zitten in de site zelf (`dist/beheer/` en `dist/_worker.js`). Er is geen aparte server en niets kost geld.
- Elke opslag is een commit, dus een versie die je kan terugzetten. In de commit staat of de klant of ARTO het deed.
- Er zijn twee rollen: **klant** (`BEHEER_WACHTWOORD`) en **ARTO** (`ARTO_WACHTWOORD`). ARTO ziet extra velden (domein, taal) en een JSON-editor.
- De techniek staat in [`templates/_kern/README.md`](../templates/_kern/README.md).

## Lokaal

```bash
cd ~/arto/<klant> && ./dev.sh
```

Open http://localhost:8790/beheer/ (elk wachtwoord werkt). Opslaan schrijft rechtstreeks naar `inhoud.json`.

## Online activeren (per klant, ± 10 minuten)

Voorwaarde: de site staat in een eigen GitHub-repo en is al eens gepubliceerd ([hosting-cloudflare.md](hosting-cloudflare.md)).

1. **GitHub-token voor de site** (zodat het paneel kan opslaan): GitHub → Settings → Developer settings → Fine-grained tokens → *Generate new token*.
   - Repository access: alleen de repo van deze site.
   - Permissions: **Contents: Read and write**, **Actions: Read**.
   - Vervaldatum: 1 jaar; zet een herinnering in je agenda.
   - Bewaar het in de wachtwoordmanager onder "ARTO / <klant> / GitHub-token beheer".
2. **Geheimen in Cloudflare zetten**:

   ```bash
   ./setup/scripts/beheer-activeren.sh ../<klant> <eigenaar>/<repo>
   ```

   Het script vraagt het klantwachtwoord, het ARTO-wachtwoord en het token, en zet ze met Wrangler als geheim in het Pages-project (`BEHEER_WACHTWOORD`, `ARTO_WACHTWOORD`, `SESSIE_GEHEIM`, `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH`). Niets komt in de repo. Gebruik voor de klant een lang wachtwoord (bv. vier woorden).
3. **Berichten van het contactformulier** (optioneel maar aangeraden): Cloudflare-dashboard → Workers & Pages → KV → *Create namespace* `berichten-<klant>`. Daarna project → Settings → Bindings → *Add* → KV namespace, naam **`BERICHTEN`**.
4. **Automatisch publiceren na opslaan**: in de GitHub-repo → Settings → Secrets and variables → Actions:
   - `CLOUDFLARE_API_TOKEN`: maak in Cloudflare (My Profile → API Tokens → Create Token → *Custom*) een token met **Account → Cloudflare Pages → Edit**, alleen voor het account van de klant.
   - `CLOUDFLARE_ACCOUNT_ID`: staat in `.cloudflare-account`.

   De workflow `.github/workflows/publiceer.yml` staat al in de site.
5. Publiceer één keer opnieuw (`./build.sh && ./deploy.sh`, of push naar `main`), open `https://<domein>/beheer/`, log in als ARTO en controleer onder **Instellingen** dat alles groen staat.
6. Noteer in `bedrijven/<slug>/bedrijf.md`: "Beheerpaneel: actief", waar de wachtwoorden en het token staan, en de vervaldatum van het token.

## De klant uitleggen

Stuur de klant de link `https://<domein>/beheer/` en het wachtwoord via een veilig kanaal (niet in dezelfde e-mail). Het paneel spreekt voor zich; de klant hoeft niets te installeren en het werkt ook op de gsm.

## Problemen

| Melding in het paneel | Oorzaak | Oplossing |
|---|---|---|
| "Opslaan is nog niet ingesteld" | `GITHUB_TOKEN` of `GITHUB_REPO` ontbreekt | Stap 2 |
| "GitHub antwoordde 401" | Token verlopen of ingetrokken | Nieuw token, stap 1 en 2 |
| "Iemand anders heeft intussen iets opgeslagen" | Twee mensen bewerkten tegelijk | Herladen; de eigen wijzigingen staan nog in het concept |
| Publicatie "mislukt" | Build of deploy faalt in GitHub Actions | Bekijk de run in GitHub (link in het paneel); vaak ontbreekt `CLOUDFLARE_API_TOKEN` |
| "Berichten zijn niet ingesteld" | Geen KV-binding `BERICHTEN` | Stap 3 |

## Nieuwe versie van het paneel naar een bestaande site

```bash
./setup/scripts/kern-bijwerken.sh ../<klant>
cd ../<klant> && git add -A && git commit -m "ARTO-kern bijgewerkt" && git push
```
