-- Evidenta: initial schema
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT,
  industry TEXT,
  contact_name TEXT,
  contact_email TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  standard TEXT NOT NULL,
  name TEXT NOT NULL,
  scope TEXT,
  requester TEXT,
  deadline TEXT,
  phase TEXT NOT NULL DEFAULT 'gap',
  status TEXT NOT NULL DEFAULT 'active',
  lead TEXT,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS projects_client ON projects(client_id);

CREATE TABLE IF NOT EXISTS assessments (
  project_id TEXT NOT NULL REFERENCES projects(id),
  item_id TEXT NOT NULL,
  status INTEGER,              -- NULL not assessed, 0 missing, 1 partial, 2 implemented, 3 evidenced
  applicable INTEGER NOT NULL DEFAULT 1,
  justification TEXT,
  note TEXT,
  owner TEXT,
  updated_at TEXT,
  updated_by TEXT,
  PRIMARY KEY (project_id, item_id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  item_id TEXT,
  title TEXT NOT NULL,
  owner TEXT,
  due TEXT,
  status TEXT NOT NULL DEFAULT 'open',   -- open, doing, done
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS tasks_project ON tasks(project_id);

CREATE TABLE IF NOT EXISTS evidence (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  item_id TEXT,
  name TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  size INTEGER NOT NULL,
  content_type TEXT,
  note TEXT,
  uploaded_at TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS evidence_project ON evidence(project_id);

CREATE TABLE IF NOT EXISTS audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL,
  user TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  project_id TEXT,
  detail TEXT
);
CREATE INDEX IF NOT EXISTS audit_project ON audit(project_id, id);
