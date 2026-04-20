-- Run this once to set up the users table

CREATE TABLE IF NOT EXISTS users (
    id        SERIAL PRIMARY KEY,
    email     VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role      VARCHAR(50) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default admin user
-- Password: admin123  (bcrypt hash below)
INSERT INTO users (email, password_hash, role)
VALUES (
    'admin@jcb.com',
    '$2b$12$eImiTXuWVxfM37uY4JANjQ==.placeholder_replace_with_real_hash',
    'admin'
)
ON CONFLICT (email) DO NOTHING;
