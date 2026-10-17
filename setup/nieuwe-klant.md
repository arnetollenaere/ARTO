# Nieuwe klant

Van eerste gesprek tot een site die klaarstaat om gebouwd te worden. Claude doet dit met de skill `nieuwe-klant`; hieronder staat wat er gebeurt, zodat je het ook met de hand kan.

## 1. Offerte

- Kopieer [`setup/sjablonen/documenten/offerte.md`](sjablonen/documenten/offerte.md) en vul het in.
- Maak meteen de klant aan (stap 2) met status `offerte`, zodat niets verloren gaat.

## 2. Bedrijfsmap aanmaken

```bash
./setup/scripts/nieuwe-klant.sh "Bakkerij Peeters"
```

Vul in `bedrijven/bakkerij-peeters/bedrijf.md` minstens in: contactpersoon, e-mail, gewenst domein.

## 3. Site-repo aanmaken

Bij akkoord zet je de status op `in opbouw` en maak je de site:

1. Maak op GitHub een nieuwe, **private** repo met de slug als naam (bv. `bakkerij-peeters`).
2. Maak de site aan vanuit een template (zie [`templates/`](../templates/README.md)) en zet ze op GitHub:

   ```bash
   cd ~/arto/ARTO
   ./setup/scripts/nieuwe-site.sh ../bakkerij-peeters \
     NAAM="Bakkerij Peeters" DOMEIN=bakkerijpeeters.be PROJECT=bakkerij-peeters \
     BESCHRIJVING="Ambachtelijke bakker in Gent." TELEFOON="+32 9 123 45 67" \
     EMAIL=info@bakkerijpeeters.be ADRES="Kerkstraat 1, 9000 Gent"
   cd ../bakkerij-peeters
   git init -b main && git add . && git commit -m "Start vanuit ARTO-template"
   git remote add origin https://github.com/arnetollenaere/bakkerij-peeters.git
   git push -u origin main
   ```

3. Noteer de repo-URL in `bedrijf.md`.

## 4. Klant vraagt hosting aan

Stuur de klant de stappen uit [hosting-cloudflare.md](hosting-cloudflare.md#wat-de-klant-doet): domein op eigen naam, gratis Cloudflare-account, jou uitnodigen als Administrator.

## 5. Logboek

Zet in `logboek.md` wat er gebeurd is (offerte verstuurd, akkoord, repo aangemaakt).

## Checklist

- [ ] Offerte verstuurd
- [ ] `bedrijven/<slug>/` aangemaakt, fiche ingevuld
- [ ] Akkoord, status `in opbouw`
- [ ] Site-repo aangemaakt vanuit een template
- [ ] Klant heeft domein en Cloudflare-account, Arne is Administrator
- [ ] Cloudflare Pages-project gekoppeld (zie [hosting-cloudflare.md](hosting-cloudflare.md))
- [ ] Site gebouwd, goedgekeurd door klant
- [ ] Domein gekoppeld, site live, status `online`
- [ ] Optimalisatie gedaan (zie [optimalisatie.md](optimalisatie.md))
