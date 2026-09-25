-- Evidenta: users and project access, generic registers, management reviews, readiness history

CREATE TABLE IF NOT EXISTS users (
  email TEXT PRIMARY KEY,
  name TEXT,
  org TEXT,
  kind TEXT NOT NULL DEFAULT 'pending',  -- admin, consultant, client, pending, disabled
  client_id TEXT REFERENCES clients(id),  -- for client users: their company
  created_at TEXT NOT NULL,
  created_by TEXT,
  last_seen TEXT
);

CREATE TABLE IF NOT EXISTS memberships (
  project_id TEXT NOT NULL REFERENCES projects(id),
  email TEXT NOT NULL,
  access TEXT NOT NULL DEFAULT 'view',    -- edit, view
  added_at TEXT NOT NULL,
  added_by TEXT NOT NULL,
  PRIMARY KEY (project_id, email)
);
CREATE INDEX IF NOT EXISTS memberships_email ON memberships(email);

CREATE TABLE IF NOT EXISTS records (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  type TEXT NOT NULL,                     -- register type, see src/registers.js
  ref INTEGER NOT NULL,
  data TEXT NOT NULL,                     -- JSON with the register's fields
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_at TEXT,
  updated_by TEXT
);
CREATE INDEX IF NOT EXISTS records_project ON records(project_id, type, ref);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  date TEXT,
  title TEXT NOT NULL,
  participants TEXT,
  status TEXT NOT NULL DEFAULT 'planned', -- planned, held, approved
  data TEXT,                              -- JSON: inputs and outputs
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS reviews_project ON reviews(project_id, date);

CREATE TABLE IF NOT EXISTS snapshots (
  project_id TEXT NOT NULL,
  day TEXT NOT NULL,
  readiness INTEGER NOT NULL,
  assessed INTEGER,
  open_tasks INTEGER,
  open_findings INTEGER,
  PRIMARY KEY (project_id, day)
);

ALTER TABLE tasks ADD COLUMN review_id TEXT;
ALTER TABLE tasks ADD COLUMN record_id TEXT;
