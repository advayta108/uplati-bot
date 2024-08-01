# Monorepo Setup

## Why split bot and SDK?

- Independent SDK versioning and publishing
- Clear boundaries between reusable package and app code
- Easier testing and CI configuration
- Reuse SDK in other projects

## Current workspace layout (recommended)

```text
UPLATI-BOT-SDK-MONOREPO/
├── lib/uplati-sdk/    # SDK package
├── packages/uplati-bot/ # Bot workspace package
└── src/               # Telegram bot source
```

This structure is already good enough for development and npm publishing.

## Workspace configuration

Root `package.json` uses:

```json
{
  "private": true,
  "workspaces": ["lib/uplati-sdk", "packages/uplati-bot"]
}
```

Useful scripts:

- `npm run build`
- `npm run build:lib`
- `npm run publish:lib`

## Alternative: separate repositories

Use one repository for SDK and one for bot if:

- SDK has its own release lifecycle
- You want independent issue tracking and releases
- Multiple apps consume the same SDK

Bot dependency example:

```json
{
  "dependencies": {
    "@advayta108/uplati-sdk": "^1.0.0"
  }
}
```

