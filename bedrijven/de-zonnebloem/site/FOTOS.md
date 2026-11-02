# Foto's

## Wijnen (`src/img/wijn/`)

De flesfoto's komen uit de webwinkel van 't Wijnveld (https://www.wijnveld.be/), de wijnhandel achter deze actie. Vraag 't Wijnveld om toestemming of nieuwe foto's als de selectie verandert.

- Formaat: staand 2:3, WebP, in twee breedtes: `<naam>-640.webp` (640×960) en `<naam>-1000.webp` (1000×1500).
- Zet daarna `"foto": "naam"` bij de wijn in `src/wijnen.json`.
- Nog geen juiste foto? Zet `"foto": null`; de site toont dan `fles-volgt` ("Foto volgt"). Nu voor geen enkele wijn meer nodig.
- `tourtes-blanc-prestige`: foto van 't Wijnveld, aangeleverd door Arne (op wijnveld.be staat bij deze wijn per vergissing de rode fles).
- `terre-di-gioia`: studiofoto van de fles (aangeleverd door Arne), door ARTO uitgeknipt en op de kurkenachtergrond van de KHS-foto van 't Wijnveld gezet (oude fles en watermerk weggewerkt met inpainting), zodat ze in dezelfde stijl is.

Omzetten met Python (Pillow):

```python
from PIL import Image
im = Image.open("origineel.jpg").convert("RGB")
w, h = im.size; nw = int(h * 2 / 3)          # bijsnijden naar 2:3
if w > nw: im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
for b, q in ((640, 58), (1000, 52)):
    im.resize((b, b * 3 // 2), Image.LANCZOS).save(f"src/img/wijn/naam-{b}.webp", "WEBP", quality=q, method=6)
```

## Logo 't Wijnveld (`src/img/sponsor/wijnveld.svg`)

Van https://www.wijnveld.be/ (logo.svg), verkleind met svgo.

## De Zonnebloem in beeld (`src/img/beeld/`)

Foto's voor de carrousel onder het openingsbeeld: `groep` en `lachen` van https://www.vzwraakpunt.be/ (In beeld), de andere vijf aangeleverd door Arne. Per foto twee groottes (langste zijde): `<naam>-700.webp` en `<naam>-1200.webp`; staande foto's krijgen de klasse `carrousel__dia--staand`. Nieuwe foto toevoegen: een `<figure class="carrousel__dia">` in `src/index.html` (sectie `#inbeeld`).

Let op: dit is een site die alcohol verkoopt. Het Belgische convenant over alcoholreclame verbiedt minderjarigen in reclame voor alcohol. Laat vzw Raakpunt bevestigen dat de foto's hier mogen staan (toestemming van de personen in beeld) en dat ze akkoord gaan met dat risico.
