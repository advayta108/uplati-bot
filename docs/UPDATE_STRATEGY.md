# Dependency Update Strategy

## Applied safe updates

The repository already includes minor and patch updates for core tooling and runtime packages.

## Deferred major updates

The following packages should be upgraded only after compatibility checks:

- `axios`
- `dotenv`
- `express`
- `jsdom`
- `@eslint/compat`
- `@types/node`
- `@types/jsdom`

## Validation checklist

```bash
npm install
npm run build
npm run build:lib
npm run lint
npm run bot
npm start
```

## Recommendation

Upgrade major versions one by one, run checks after each step, and publish only after runtime verification.

