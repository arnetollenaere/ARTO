-- Bestellingen per bezoeker beperken (spam). Alleen een hash van IP + dag, geen IP-adres.
ALTER TABLE bestellingen ADD COLUMN ip_hash TEXT;
CREATE INDEX IF NOT EXISTS bestellingen_ip ON bestellingen(ip_hash, aangemaakt);
