-- Seed data for development and testing

-- Insert demo user (password: 'password123')
INSERT INTO users (email, password_hash, subscription_plan)
VALUES
    ('demo@example.com', '$2a$10$rqQXVX.qZ5Z5Q5Z5Q5Z5Q5Z5Q5Z5Q5Z5Q5Z5Q5Z5Q5Z5Q5Z5Q5Z5', 'pro'),
    ('test@example.com', '$2a$10$rqQXVX.qZ5Z5Q5Z5Q5Z5Q5Z5Q5Z5Q5Z5Q5Z5Q5Z5Q5Z5Q5Z5Q5Z5', 'starter')
ON CONFLICT (email) DO NOTHING;

-- Note: In production, you would:
-- 1. Not include seed data
-- 2. Use proper password hashing
-- 3. Create initial admin user through secure process
