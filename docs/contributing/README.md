# AssetFlow - Contributing Guidelines

Welcome to the AssetFlow developer team!

## Code Style & Standards

To keep codebase readability clean and maintainable, adhere to these styles:

### Naming Conventions

- **Folders**: kebab-case (e.g. `client/src/features/transfers`)
- **React Components**: PascalCase (e.g. `TransferList.jsx`)
- **Functions & Variables**: camelCase (e.g. `fetchAssets`, `isLoading`)
- **Constants**: UPPER_SNAKE_CASE (e.g. `MAX_FILE_SIZE`)
- **Files**: kebab-case or extension-based controllers (e.g. `assets.controller.js`)

### Formatting

We use **ESLint** and **Prettier** to enforce syntax structure.
Always format your changes before committing:

```bash
npm run format
npm run lint
```

Pre-commit checks will automatically run lint-staged scripts via Husky to prevent formatting issues from entering source control.
