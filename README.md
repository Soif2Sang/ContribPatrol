# Contribution Patrol

> A GitHub App built with [Probot](https://github.com/probot/probot) that helps repository maintainers moderate pull requests and control contributions through an automated moderation system.

## Features

### 🛡️ Automatic PR Filtering
- Automatically closes pull requests from banned users
- Adds explanatory comments and labels to closed PRs
- Supports both permanent and temporary bans

### 💬 ChatOps Commands
Control moderation directly from PR comments using simple commands:

**Moderation Commands** (Available to maintainers and whitelisted users):
- `@contribution-patrol ban <username> [reason]` - Permanently ban a user
- `@contribution-patrol tempban <username> <days> [reason]` - Temporarily ban a user
- `@contribution-patrol unban <username>` - Remove a ban

**Whitelist Management** (Maintainers only):
- `@contribution-patrol whitelist <username>` - Add user to whitelist (grants moderation permissions)
- `@contribution-patrol unwhitelist <username>` - Remove user from whitelist

### 📊 Persistent Database
- PostgreSQL database for storing bans, trusted users, and repositories
- Supports temporary bans with automatic expiration
- Scoped bans per repository

## Setup

### Prerequisites
- Node.js >= 18
- Docker & Docker Compose (for PostgreSQL)
- GitHub App credentials

### Installation

```sh
# Install dependencies
npm install

# Start PostgreSQL database
docker-compose up -d

# Build the project
npm run build

# Run the bot
npm start
```

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/contrib_patrol

# GitHub App
APP_ID=your-app-id
PRIVATE_KEY=your-private-key
WEBHOOK_SECRET=your-webhook-secret
```

## Database Management

```sh
# Generate migrations
npm run db:generate

# Apply migrations
npm run db:migrate

# Push schema directly (development)
npm run db:push

# Open Drizzle Studio
npm run db:studio
```

## Docker

```sh
# Build container
docker build -t contrib-patrol .

# Run with environment variables
docker run -e APP_ID=<app-id> -e PRIVATE_KEY=<pem-value> -e DATABASE_URL=<db-url> contrib-patrol
```

## Usage

1. Install the app on your repository
2. Use commands in PR comments to moderate contributors:

```
@contribution-patrol ban @spammer Posting spam content
@contribution-patrol tempban @newuser 7d Needs more review time
@contribution-patrol whitelist @trusted-contributor
```

3. Banned users will have their PRs automatically closed when opened

## Contributing

If you have suggestions for how Contribution Patrol could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2026 Soif2Sang
