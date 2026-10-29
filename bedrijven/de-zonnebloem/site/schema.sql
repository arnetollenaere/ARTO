-- Database voor de bestellingen (Cloudflare D1).
-- Lokaal:   npx wrangler d1 execute zonnebloem-bestellingen-eu --local --file schema.sql
-- Online:   npx wrangler d1 execute zonnebloem-bestellingen-eu --remote --file schema.sql
CREATE TABLE IF NOT EXISTS bestellingen (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  nummer         TEXT UNIQUE,
  ogm            TEXT UNIQUE,
  token          TEXT NOT NULL,
  aangemaakt     TEXT NOT NULL,
  bijgewerkt     TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'nieuw',  -- nieuw, betaald, klaar, afgeleverd, geannuleerd
  naam           TEXT NOT NULL,
  email          TEXT NOT NULL,
  telefoon       TEXT NOT NULL,
  levering       TEXT NOT NULL,                  -- afhalen of levering
  afhaalmoment   TEXT,
  adres          TEXT,
  postcode       TEXT,
  gemeente       TEXT,
  opmerking      TEXT,
  regels         TEXT NOT NULL,                  -- JSON: [{id, naam, prijs, aantal}]
  flessen        INTEGER NOT NULL,
  subtotaal      INTEGER NOT NULL,               -- eurocent
  leveringskost  INTEGER NOT NULL DEFAULT 0,
  totaal         INTEGER NOT NULL,
  betaald_op     TEXT,
  afgeleverd_op  TEXT,
  notitie_beheer TEXT,
  ip_hash        TEXT                            -- hash van IP + dag, voor spambeperking
);
CREATE INDEX IF NOT EXISTS bestellingen_status ON bestellingen(status);
CREATE INDEX IF NOT EXISTS bestellingen_ip ON bestellingen(ip_hash, aangemaakt);
