# npm Publish Guide

## Prerequisites

1. npm account:

```bash
npm login
```

2. Verify `lib/uplati-sdk/package.json`:
- package name (`@advayta108/uplati-sdk`)
- version
- repository metadata

## Build and check package

```bash
cd lib/uplati-sdk
npm run build
npm pack --dry-run
```

## Publish

From SDK folder:

```bash
cd lib/uplati-sdk
npm publish --access public
```

Or from repository root:

```bash
npm run publish:lib
```

## Version bump

```bash
cd lib/uplati-sdk
npm version patch   # 1.0.0 -> 1.0.1
npm version minor   # 1.0.0 -> 1.1.0
npm version major   # 1.0.0 -> 2.0.0
```

Then publish:

```bash
npm run build
npm publish --access public
```

## Install published package

```bash
npm install @advayta108/uplati-sdk
```

## Useful npm commands

```bash
npm view @advayta108/uplati-sdk
npm view @advayta108/uplati-sdk versions
npm view @advayta108/uplati-sdk version
```

