CREATE TABLE IF NOT EXISTS support_requests (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(4000) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

CREATE INDEX IF NOT EXISTS idx_support_requests_user_created_at
    ON support_requests (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_requests_status
    ON support_requests (status);
