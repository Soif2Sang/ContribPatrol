-- Core entities
CREATE TABLE IF NOT EXISTS repositories (
	id BIGSERIAL PRIMARY KEY,
	owner_username TEXT NOT NULL,
	repo_name TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	UNIQUE (owner_username, repo_name)
);

CREATE TABLE IF NOT EXISTS users (
	id BIGSERIAL PRIMARY KEY,
	username TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- Whitelist (trusted users) scoped to a repository
CREATE TABLE IF NOT EXISTS trusted_users (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    repo_id BIGINT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, repo_id)
);

-- Blacklist (bans) with optional expiration scoped to a repository
CREATE TABLE IF NOT EXISTS bans (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    repo_id BIGINT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    reason TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NULL,
    UNIQUE (user_id, repo_id),
    CHECK (expires_at IS NULL OR expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_trusted_users_repo_user
    ON trusted_users (repo_id, user_id);

CREATE INDEX IF NOT EXISTS idx_bans_user_repo 
    ON bans (user_id, repo_id);