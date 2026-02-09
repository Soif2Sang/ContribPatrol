# contrib-patrol

> A GitHub App built with [Probot](https://github.com/probot/probot) that Contribution-Patrol is a Github App that allows you to moderate your PullRequest section.

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## Docker

```sh
# 1. Build container
docker build -t contrib-patrol .

# 2. Start container
docker run -e APP_ID=<app-id> -e PRIVATE_KEY=<pem-value> contrib-patrol
```

## Contributing

If you have suggestions for how contrib-patrol could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2026 Soif2Sang
