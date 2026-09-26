-- Evidenta: log of invoice e-mails (sent through Cloudflare Email Service)
CREATE TABLE IF NOT EXISTS invoice_emails (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES invoices(id),
  kind TEXT NOT NULL DEFAULT 'invoice',
  recipients TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL,
  message_id TEXT,
  error TEXT,
  sent_at TEXT NOT NULL,
  sent_by TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS invoice_emails_inv ON invoice_emails(invoice_id);
