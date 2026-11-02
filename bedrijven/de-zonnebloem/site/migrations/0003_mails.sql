-- E-mails per bestelling bijhouden: bevestiging, betaald-mail, herinneringen en de laatste fout.
ALTER TABLE bestellingen ADD COLUMN mail_bevestiging TEXT;
ALTER TABLE bestellingen ADD COLUMN mail_betaald TEXT;
ALTER TABLE bestellingen ADD COLUMN herinnerd_op TEXT;
ALTER TABLE bestellingen ADD COLUMN herinneringen INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bestellingen ADD COLUMN mail_fout TEXT;
