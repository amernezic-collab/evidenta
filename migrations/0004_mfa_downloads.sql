-- Evidenta: MFA (TOTP) for users, download approval per project membership

ALTER TABLE users ADD COLUMN mfa_required INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN mfa_secret TEXT;
ALTER TABLE users ADD COLUMN mfa_enabled_at TEXT;
ALTER TABLE users ADD COLUMN mfa_last_step INTEGER;
ALTER TABLE memberships ADD COLUMN can_download INTEGER NOT NULL DEFAULT 1;
ALTER TABLE memberships ADD COLUMN download_requested_at TEXT;

CREATE TABLE IF NOT EXISTS app_secrets (k TEXT PRIMARY KEY, v TEXT NOT NULL);

UPDATE users SET mfa_required = 1 WHERE kind = 'client';
UPDATE memberships SET can_download = 0 WHERE email IN (SELECT email FROM users WHERE kind = 'client');
ALTER TABLE users ADD COLUMN mfa_fails INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN mfa_lock_until TEXT;
