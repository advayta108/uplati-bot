# ts-uplati-bot

Monorepo with two parts:

- `lib/uplati-sdk` - reusable TypeScript SDK for Uplati API
- `src/` + `run.ts` - Telegram bot and automation app built on top of SDK

Russian documentation: `README.RU.md`

## Install

```bash
npm install
```

## Run bot

```bash
npm run bot
```

## Run automatic meter sender

```bash
npm start
```

## Build

```bash
# app + bot
npm run build

# SDK package only
npm run build:lib
```

## SDK usage in external projects

```bash
npm install @advayta108/uplati-sdk
```

```typescript
import { UplatiClient } from '@advayta108/uplati-sdk';
```

SDK details and API methods: `lib/uplati-sdk/README.md`

## Publish SDK to npm

From the monorepo root:

```bash
npm run publish:lib
```

Or manually from SDK directory:

```bash
cd lib/uplati-sdk
npm publish --access public
```

## CI/CD

- Build pipeline: `.github/workflows/build.yml`
- Lint pipeline: `.github/workflows/lint.yml`
- Bot deploy pipeline: `.github/workflows/deploy.yml`
- SDK publish pipeline: `.github/workflows/publish-sdk.yml`
