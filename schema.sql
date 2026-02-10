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

