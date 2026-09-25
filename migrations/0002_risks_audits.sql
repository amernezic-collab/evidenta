-- Evidenta: risk register, internal audits and findings

CREATE TABLE IF NOT EXISTS risks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  ref INTEGER NOT NULL,                 -- R-001, R-002 ... per project
  asset TEXT NOT NULL,                  -- information asset or process
  threat TEXT,
  vulnerability TEXT,
  owner TEXT,                           -- risk owner
  likelihood INTEGER,                   -- 1..5
  impact INTEGER,                       -- 1..5
  treatment TEXT NOT NULL DEFAULT 'reduce',  -- reduce, accept, avoid, transfer
  controls TEXT,                        -- comma separated catalogue item ids (a5.1,a8.13)
  plan TEXT,
  res_likelihood INTEGER,
  res_impact INTEGER,
  status TEXT NOT NULL DEFAULT 'open',  -- open, treating, accepted, closed
  review_date TEXT,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_at TEXT,
  updated_by TEXT
);
CREATE INDEX IF NOT EXISTS risks_project ON risks(project_id, ref);

CREATE TABLE IF NOT EXISTS audits (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  title TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'internal', -- internal, customer, certification
  date TEXT,
  auditor TEXT,
  scope TEXT,
  status TEXT NOT NULL DEFAULT 'planned', -- planned, done
  summary TEXT,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS audits_project ON audits(project_id, date);

CREATE TABLE IF NOT EXISTS findings (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  audit_id TEXT REFERENCES audits(id),
  ref INTEGER NOT NULL,                 -- N-001 ... per project
  item_id TEXT,                         -- clause or control
  kind TEXT NOT NULL DEFAULT 'minor',   -- major, minor, obs, ofi
  title TEXT NOT NULL,
  description TEXT,
  cause TEXT,
  correction TEXT,                      -- immediate correction and corrective action
  owner TEXT,
  due TEXT,
  status TEXT NOT NULL DEFAULT 'open',  -- open, action, verify, closed
  closed_at TEXT,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS findings_project ON findings(project_id, ref);

ALTER TABLE tasks ADD COLUMN risk_id TEXT;
ALTER TABLE tasks ADD COLUMN finding_id TEXT;
