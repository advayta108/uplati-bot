# Upgrade Notes

## Dependency updates

Core runtime and tooling dependencies were updated to currently stable versions with backward compatibility in mind.

## TypeScript config updates

Main improvements:

- target is modernized (`ES2022`)
- declaration maps and source maps are enabled
- module resolution and interop options were standardized

## Validation

The following checks were completed successfully:

- `npm run build`
- `npm run build:lib`
- `npm run lint`

## Rollback (if needed)

```bash
git checkout package.json lib/uplati-sdk/package.json tsconfig.json lib/uplati-sdk/tsconfig.json
npm install
```

