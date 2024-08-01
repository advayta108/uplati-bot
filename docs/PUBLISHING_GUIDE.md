# SDK Publishing Overview

This repository contains:

1. **Bot app** in the root folder (deployed, not published to npm)
2. **SDK package** in `lib/uplati-sdk` (published to npm)

## Package name and scope

Current SDK package name:

```json
"name": "@advayta108/uplati-sdk"
```

Because this is a scoped package, publish with `--access public`.

## Manual release flow

```bash
cd lib/uplati-sdk
npm login
npm version patch
npm run build
npm publish --access public
```

## Automated release flow (GitHub Actions)

Workflow: `.github/workflows/publish-sdk.yml`

Triggers:
- release published
- tag push matching `sdk-v*`
- manual run (`workflow_dispatch`)

Required secret:
- `NPM_TOKEN`
