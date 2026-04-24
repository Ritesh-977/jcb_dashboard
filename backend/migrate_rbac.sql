-- RBAC Migration: run once against MY_DASHBOARD.PUBLIC schema

ALTER TABLE USERS ADD COLUMN IF NOT EXISTS PERMISSIONS VARCHAR(1000) DEFAULT '[]';
ALTER TABLE USERS ADD COLUMN IF NOT EXISTS IS_ACTIVE BOOLEAN DEFAULT TRUE;

-- Update existing users: admins get full permissions, viewers get basic
UPDATE USERS SET PERMISSIONS = '["view_kpi","view_sentiment","view_comments","view_trend"]', IS_ACTIVE = TRUE WHERE ROLE = 'admin';
UPDATE USERS SET PERMISSIONS = '["view_kpi"]', IS_ACTIVE = TRUE WHERE ROLE = 'viewer';

-- Ensure any legacy rows without a role default to viewer
UPDATE USERS SET ROLE = 'viewer' WHERE ROLE IS NULL;
