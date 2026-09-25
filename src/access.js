/*
 * Access control for Evidenta.
 * Cloudflare Access decides who may log in. Evidenta decides what each person sees:
 *   admin       all clients and projects, manages users and project access
 *   consultant  only projects they are a member of (edit or view), may create clients and projects
 *   client      only projects of their own company they are a member of, normally view only
 *   pending     logged in but not yet approved: sees nothing
 *   disabled    no access
 * The first person to log in when no admin exists becomes admin.
 */
const now = () => new Date().toISOString();

export async function loadUser(env, email) {
  let u = await env.DB.prepare("SELECT * FROM users WHERE email=?").bind(email).first();
  if (!u) {
    const admin = await env.DB.prepare("SELECT 1 FROM users WHERE kind='admin' LIMIT 1").first();
    u = { email, name: null, org: null, kind: admin ? "pending" : "admin", client_id: null, created_at: now(), created_by: "self", last_seen: now() };
    await env.DB.prepare("INSERT OR IGNORE INTO users (email,kind,created_at,created_by,last_seen) VALUES (?,?,?,?,?)").bind(email, u.kind, u.created_at, "self", u.last_seen).run();
  } else if (!u.last_seen || Date.now() - new Date(u.last_seen) > 10 * 60e3) {
    await env.DB.prepare("UPDATE users SET last_seen=? WHERE email=?").bind(now(), email).run();
  }
  return u;
}
export const isAdmin = u => u.kind === "admin";
export const active = u => ["admin", "consultant", "client"].includes(u.kind);

/* SQL condition limiting a project id column to what the user may see; returns [sql, binds] */
export function scope(u, col) {
  if (isAdmin(u)) return ["1=1", []];
  if (u.kind === "client") return [`${col} IN (SELECT m.project_id FROM memberships m JOIN projects px ON px.id=m.project_id WHERE m.email=? AND px.client_id=?)`, [u.email, u.client_id || "-"]];
  return [`${col} IN (SELECT project_id FROM memberships WHERE email=?)`, [u.email]];
}

/* "edit", "view" or null */
export async function projectAccess(env, u, project) {
  if (!project || !active(u)) return null;
  if (isAdmin(u)) return "edit";
  if (u.kind === "client" && project.client_id !== u.client_id) return null;
  const m = await env.DB.prepare("SELECT access FROM memberships WHERE project_id=? AND email=?").bind(project.id, u.email).first();
  if (!m) return null;
  return u.kind === "client" && m.access === "edit" ? "edit" : m.access;
}
