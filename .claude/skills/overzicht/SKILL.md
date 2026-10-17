---
name: overzicht
description: Toont een overzicht van alle ARTO-klanten en sites met status, domein, repo en openstaande punten. Gebruik bij "overzicht", "welke klanten", "hoe staat het ervoor", "wat moet ik nog doen".
---

# Overzicht van alle klanten

1. Lees elke `bedrijven/*/bedrijf.md` (sla `README.md` over).
2. Haal per klant op: naam, status, domein, repo, live sinds, en of Arne Administrator is in het Cloudflare-account.
3. Lees de bovenste regels van elk `logboek.md` voor de laatste activiteit.
4. Toon één tabel, gesorteerd op status (`in opbouw`, `offerte`, `online`, `overgedragen`, `gestopt`):

   | Klant | Status | Domein | Laatste activiteit | Open punten |
   |---|---|---|---|---|

5. Onder de tabel: een korte lijst "Wat nu?" met concrete acties, bijvoorbeeld:
   - fiches met lege verplichte velden (contact, domein, repo);
   - klanten `in opbouw` zonder Cloudflare-toegang;
   - `online` sites waarvan de laatste optimalisatie (zie logboek) meer dan 6 maanden oud is of nooit gebeurde;
   - offertes ouder dan 30 dagen.

Wijzig niets; dit is alleen lezen. Wil Arne één klant in detail, toon dan de volledige fiche en de laatste 10 logboekregels.
