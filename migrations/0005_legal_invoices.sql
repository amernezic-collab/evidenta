-- Evidenta: legal-entity data for clients, issuer settings, invoices

ALTER TABLE clients ADD COLUMN legal_name TEXT;
ALTER TABLE clients ADD COLUMN country_code TEXT;
ALTER TABLE clients ADD COLUMN address TEXT;
ALTER TABLE clients ADD COLUMN postal_code TEXT;
ALTER TABLE clients ADD COLUMN city TEXT;
ALTER TABLE clients ADD COLUMN id_number TEXT;
ALTER TABLE clients ADD COLUMN vat_number TEXT;
ALTER TABLE clients ADD COLUMN court_reg TEXT;
ALTER TABLE clients ADD COLUMN phone TEXT;
ALTER TABLE clients ADD COLUMN email TEXT;
ALTER TABLE clients ADD COLUMN website TEXT;
ALTER TABLE clients ADD COLUMN iban TEXT;
ALTER TABLE clients ADD COLUMN contact_phone TEXT;
ALTER TABLE clients ADD COLUMN invoice_email TEXT;
ALTER TABLE clients ADD COLUMN updated_at TEXT;
UPDATE clients SET country_code = 'BA' WHERE country_code IS NULL AND upper(trim(coalesce(country, ''))) IN ('BIH', 'BA', 'BOSNA I HERCEGOVINA', 'BOSNIA AND HERZEGOVINA');

CREATE TABLE IF NOT EXISTS app_settings (k TEXT PRIMARY KEY, v TEXT NOT NULL, updated_at TEXT, updated_by TEXT);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  number TEXT UNIQUE,
  year INTEGER,
  seq INTEGER,
  client_id TEXT NOT NULL REFERENCES clients(id),
  project_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft',      -- draft, issued, shared, paid, cancelled
  lang TEXT NOT NULL DEFAULT 'bs',
  currency TEXT NOT NULL DEFAULT 'BAM',
  issue_date TEXT,
  service_date TEXT,
  due_date TEXT,
  place TEXT,
  vat_note TEXT,
  notes TEXT,
  subtotal INTEGER NOT NULL DEFAULT 0,        -- minor units (feninga / cents)
  vat_total INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  client_snapshot TEXT,
  issuer_snapshot TEXT,
  pdf_key TEXT,
  pdf_sha256 TEXT,
  approved_by TEXT,
  approved_name TEXT,
  approved_at TEXT,
  verify_code TEXT,
  signed_key TEXT,
  signed_sha256 TEXT,
  signed_at TEXT,
  signed_by TEXT,
  shared_at TEXT,
  shared_by TEXT,
  client_viewed_at TEXT,
  paid_at TEXT,
  cancelled_at TEXT,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS invoices_client ON invoices(client_id);
CREATE UNIQUE INDEX IF NOT EXISTS invoices_year_seq ON invoices(year, seq);

CREATE TABLE IF NOT EXISTS invoice_items (
  invoice_id TEXT NOT NULL REFERENCES invoices(id),
  pos INTEGER NOT NULL,
  description TEXT NOT NULL,
  qty REAL NOT NULL DEFAULT 1,
  unit TEXT,
  unit_price INTEGER NOT NULL DEFAULT 0,
  vat_rate REAL NOT NULL DEFAULT 0,
  PRIMARY KEY (invoice_id, pos)
);
