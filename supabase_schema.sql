-- =============================================
-- SALON MANAGER — Schema Supabase
-- Esegui questo script nell'editor SQL di Supabase
-- =============================================

-- Tabella clienti
CREATE TABLE clienti (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella servizi
CREATE TABLE servizi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  durata_minuti INTEGER NOT NULL,
  prezzo NUMERIC(10,2) NOT NULL,
  attivo BOOLEAN DEFAULT TRUE
);

-- Dati di esempio per i servizi
INSERT INTO servizi (nome, durata_minuti, prezzo) VALUES
  ('Taglio donna', 45, 35.00),
  ('Taglio uomo', 25, 20.00),
  ('Piega', 30, 25.00),
  ('Colore completo', 120, 80.00),
  ('Taglio + Piega1', 75, 55.00),
  ('Meches', 90, 70.00),
  ('Trattamento', 60, 45.00),
  ('Permanente', 120, 75.00);

-- Tabella prenotazioni
CREATE TABLE prenotazioni (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clienti(id) ON DELETE SET NULL,
  servizio_id UUID REFERENCES servizi(id) ON DELETE SET NULL,
  data_ora TIMESTAMPTZ NOT NULL,
  durata_minuti INTEGER NOT NULL,
  prezzo NUMERIC(10,2) NOT NULL,
  stato TEXT CHECK (stato IN ('confermata', 'completata', 'cancellata')) DEFAULT 'confermata',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vista per prenotazioni con dettagli cliente e servizio
CREATE OR REPLACE VIEW prenotazioni_dettaglio AS
SELECT
  p.id,
  p.data_ora,
  p.durata_minuti,
  p.prezzo,
  p.stato,
  p.note,
  p.created_at,
  c.id AS cliente_id,
  c.nome || ' ' || c.cognome AS cliente_nome,
  c.telefono AS cliente_telefono,
  s.id AS servizio_id,
  s.nome AS servizio_nome
FROM prenotazioni p
LEFT JOIN clienti c ON p.cliente_id = c.id
LEFT JOIN servizi s ON p.servizio_id = s.id;

-- Vista statistiche mensili
CREATE OR REPLACE VIEW stats_mensili AS
SELECT
  DATE_TRUNC('month', data_ora) AS mese,
  COUNT(*) FILTER (WHERE stato != 'cancellata') AS totale_appuntamenti,
  SUM(prezzo) FILTER (WHERE stato = 'completata') AS incasso_totale,
  AVG(prezzo) FILTER (WHERE stato = 'completata') AS scontrino_medio
FROM prenotazioni
GROUP BY DATE_TRUNC('month', data_ora)
ORDER BY mese DESC;

-- Row Level Security (RLS) — disabilita per uso semplice o configura per multi-tenant
ALTER TABLE clienti ENABLE ROW LEVEL SECURITY;
ALTER TABLE servizi ENABLE ROW LEVEL SECURITY;
ALTER TABLE prenotazioni ENABLE ROW LEVEL SECURITY;

-- Policy permissiva (accesso completo con chiave anon) — per demo
-- In produzione sostituire con autenticazione
CREATE POLICY "Accesso completo clienti" ON clienti FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Accesso completo servizi" ON servizi FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Accesso completo prenotazioni" ON prenotazioni FOR ALL USING (true) WITH CHECK (true);
