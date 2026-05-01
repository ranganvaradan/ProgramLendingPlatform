-- V1__init_iam_schema.sql
-- IAM Service — Users, Roles, Sessions

CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               VARCHAR(100) NOT NULL UNIQUE,
    password_hash       VARCHAR(255) NOT NULL,
    full_name           VARCHAR(100) NOT NULL,
    phone               VARCHAR(15),
    role                VARCHAR(30) NOT NULL,
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING_VERIFICATION',
    linked_entity_id    UUID,
    linked_entity_type  VARCHAR(30),
    last_login_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_linked_entity ON users(linked_entity_id);

-- Seed default admin user (password: Admin@PLP2026)
INSERT INTO users (email, password_hash, full_name, role, status)
VALUES ('admin@plp.com', '$2b$10$CPfnMXAxCJlT9vOe9z6dI.s/77kG01xqHq2ZH8uX8R/vuP5To48ay', 'Platform Admin', 'PLATFORM_ADMIN', 'ACTIVE');
