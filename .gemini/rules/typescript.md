# TypeScript Rules

- **Relative Imports:** All relative imports MUST end in `.js`, even if the source file is `.ts` (NodeNext requirement).
- **Shared Types:** `shared/types.d.ts` must use the `.d.ts` extension, never `.ts`. This prevents `rootDir` expansion issues during deployment.
- **Express App/Server Split:** `server/src/app.ts` must export the Express app without `listen()`. `server/src/server.ts` is the entry point that imports `app` and `listen()`. This structure is required for `supertest` integration testing.
- **ESM Modules:** In ESM modules (NodeNext), `__dirname` is not available. Use `fileURLToPath(import.meta.url)` with `dirname()` from `'path'` to derive directory paths.
- **Workspace Configs:** Every workspace `tsconfig.json` must extend the root `tsconfig.json`. Do not duplicate base settings.
- **Type Safety:** Never widen a type (`as any`, `as unknown as T`) to silence a TypeScript error. Fix the type definition properly.
- **Unchecked Access:** `noUncheckedIndexedAccess: true` is enabled. Array or object property accesses may return `undefined`; always handle this possibility explicitly with guards or optional chaining.
