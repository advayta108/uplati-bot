<h1 align="center">UPLATI-BOT-SDK-MONOREPO</h1>

<p align="center">
  <img src="https://lk.uplati.ru/images/logo.png" alt="Система Город Logo" width="220" />
</p>

<p align="center">
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" /></a>
  <a href="https://www.npmjs.com/package/telegraf"><img src="https://img.shields.io/badge/Telegraf-26A5E4?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegraf" /></a>
  <a href="https://axios-http.com/"><img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white" alt="Axios" /></a>
  <a href="https://www.sqlite.org/"><img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" /></a>
  <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" /></a>
</p>

<p align="center">
  <a href="./README.md"><img src="https://img.shields.io/badge/English-0052CC?style=for-the-badge&logo=github&logoColor=white" alt="English" /></a>
  <a href="./README.RU.md"><img src="https://img.shields.io/badge/Русский-0052CC?style=for-the-badge&logo=github&logoColor=white" alt="Русский" /></a>
</p>

<p align="center">
  <a href="https://uplati.ru"><img src="https://img.shields.io/badge/API_Version-3.25.10-orange.svg" alt="API Version" /></a>
  <a href="https://github.com/advayta108/uplati-bot/actions/workflows/deploy.yml"><img src="https://github.com/advayta108/uplati-bot/actions/workflows/deploy.yml/badge.svg" alt="Deploybot" /></a>
  <a href="https://github.com/advayta108/uplati-bot/actions/workflows/build.yml"><img src="https://github.com/advayta108/uplati-bot/actions/workflows/build.yml/badge.svg" alt="Build" /></a>
  <a href="https://github.com/advayta108/uplati-bot/actions/workflows/lint.yml"><img src="https://github.com/advayta108/uplati-bot/actions/workflows/lint.yml/badge.svg" alt="Lint" /></a>
  <a href="https://github.com/advayta108/uplati-bot/actions/workflows/publish-sdk.yml"><img src="https://github.com/advayta108/uplati-bot/actions/workflows/publish-sdk.yml/badge.svg" alt="Publish SDK" /></a>
  <a href="https://app.fossa.com/projects/git%2Bgithub.com%2Fadvayta108%2Fuplati-bot?ref=badge_small"><img src="https://app.fossa.com/api/projects/git%2Bgithub.com%2Fadvayta108%2Fuplati-bot.svg?type=small" alt="FOSSA Status" /></a>
</p>

`UPLATI-BOT-SDK-MONOREPO` is a production-oriented TypeScript monorepo for the Uplati ecosystem ([uplati.ru](https://uplati.ru)).
It combines a reusable SDK package for API integrations and a full Telegram bot example that demonstrates real-world authentication, meter retrieval, readings submission, receipts, and transaction flows.
The repository is designed so you can both publish the SDK to npm and deploy the bot with GitHub Actions from the same codebase.
Live deployed bot example: [@uplatibot](https://t.me/uplatibot).

TypeScript monorepo with:

- `lib/uplati-sdk` - npm SDK for Uplati API
- `packages/uplati-bot` - workspace package for bot app
- `src/` + `run.ts` - bot source and automation worker

## 🧱 Project Structure

```text
.
├── lib/uplati-sdk/      # SDK package
├── packages/uplati-bot/ # Bot workspace package
├── src/                 # Bot source code
├── run.ts               # Background meter sender
└── docs/                # Deployment/publishing guides
```

## 🚀 Quick Start

```bash
npm install
cp .env.example .env  # if you use template
```

Set environment variables in `.env`:

```env
TELEGRAM_BOT_TOKEN=your_token
SEND_DATA=true
```

Run:

```bash
# Telegram bot
npm run bot

# Background sender
npm start
```

## 🛠️ Build And Quality

```bash
# Build bot + app
npm run build

# Build SDK only
npm run build:lib

# Lint
npm run lint
```

## 📦 SDK Usage

Install from npm:

```bash
npm install @advayta108/uplati-sdk
```

npm package: [npmjs.com/package/@advayta108/uplati-sdk](https://www.npmjs.com/package/@advayta108/uplati-sdk)

Use in your app:

```typescript
import { UplatiClient } from '@advayta108/uplati-sdk';
```

SDK documentation: [`lib/uplati-sdk/README.md`](lib/uplati-sdk/README.md) (EN), [`lib/uplati-sdk/README.RU.md`](lib/uplati-sdk/README.RU.md) (RU)

## 📤 Publish SDK

From monorepo root:

```bash
npm run publish:lib
```

Or manually:

```bash
cd lib/uplati-sdk
npm publish --access public
```

## 📚 Docs

- Deployment guide: [`docs/DEPLOY.md`](docs/DEPLOY.md)
- Publishing guide: [`docs/PUBLISHING_GUIDE.md`](docs/PUBLISHING_GUIDE.md)
- Monorepo notes: [`docs/MONOREPO_SETUP.md`](docs/MONOREPO_SETUP.md)

## ✅ TODO

- Project backlog: [`TODO.md`](TODO.md)

## 🔄 CI/CD

- Build: `.github/workflows/build.yml`
- Lint: `.github/workflows/lint.yml`
- Bot deploy: `.github/workflows/deploy.yml`
- SDK publish: `.github/workflows/publish-sdk.yml`

## 📄 License

MIT. See [`LICENSE`](LICENSE).
