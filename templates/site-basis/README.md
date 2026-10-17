# {{NAAM}}

Website van {{NAAM}}, gemaakt door ARTO. Live op https://{{DOMEIN}}.

## Structuur

```
src/            # de site zoals ze online komt
├── index.html
├── 404.html
├── css/style.css
├── img/
├── _headers    # beveiligings- en cache-headers voor Cloudflare
├── robots.txt
└── sitemap.xml
build.sh        # kopieert src/ naar dist/
deploy.sh       # publiceert dist/ naar Cloudflare Pages
.cloudflare-account   # account-ID van het Cloudflare-account (geen geheim)
CLAUDE.md       # instructies voor Claude Code
```

## Lokaal bekijken

```bash
./build.sh
npx wrangler pages dev dist
```

Open daarna http://localhost:8788.

## Publiceren

```bash
./build.sh && ./deploy.sh            # productie
./build.sh && ./deploy.sh preview    # testversie
```

De eerste keer: `npx wrangler login`.

## Velden in te vullen bij een nieuwe klant

Dit is het sjabloon `site-basis` uit de ARTO-repo. Vervang na het kopiëren deze velden in alle bestanden:

| Veld | Voorbeeld |
|---|---|
| `{{NAAM}}` | Bakkerij Peeters |
| `{{DOMEIN}}` | bakkerijpeeters.be |
| `{{PROJECT}}` | bakkerij-peeters (naam van het Cloudflare Pages-project) |
| `{{BESCHRIJVING}}` | Ambachtelijke bakker in Gent sinds 1985. |
| `{{TELEFOON}}` | +32 9 123 45 67 |
| `{{EMAIL}}` | info@bakkerijpeeters.be |
| `{{ADRES}}` | Kerkstraat 1, 9000 Gent |

Zet ook het account-ID van de klant in `.cloudflare-account`. Verwijder daarna deze sectie.
