-- =========================
-- athletiq core tables
-- =========================

CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    age             INTEGER,
    sex             TEXT CHECK (sex IN ('male', 'female')),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE measurements (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    grip_right      INTEGER,
    grip_left       INTEGER,
    standing_jump   INTEGER,
    dash_15m        INTEGER,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);