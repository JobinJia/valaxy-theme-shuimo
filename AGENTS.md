# Repository Guidelines

## Project Structure & Module Organization
This repository is a `pnpm` workspace for the Shuimo theme and its demo site. Core theme source lives in `theme/`: Vue components in `theme/components`, shared logic in `theme/composables`, layouts in `theme/layouts`, route pages in `theme/pages`, styles in `theme/styles`, and public types in `theme/types`. The local preview app lives in `demo/`, with content pages under `demo/pages` and static assets under `demo/public`. Top-level config files include `eslint.config.js`, `uno.config.ts`, and `tsconfig.json`.

## Build, Test, and Development Commands
- `pnpm install`: install workspace dependencies.
- `pnpm dev`: start the Valaxy demo site locally from `demo/`.
- `pnpm build`: build the demo as static output.
- `pnpm lint`: run ESLint across the workspace.
- `pnpm typecheck`: run `vue-tsc` type checks without emitting files.
- `pnpm release`: bump versions and publish workspace packages; use only for release work.

## Coding Style & Naming Conventions
Use TypeScript and Vue 3 SFCs consistently. Follow the existing `Shuimo*.vue` component naming pattern for theme UI components and `use*.ts` for composables, for example `ShuimoHeader.vue` and `useBrushStyles.ts`. Prefer concise, focused modules over large mixed-purpose files. Linting is powered by `@antfu/eslint-config` with UnoCSS support; run `pnpm lint` before opening a PR. Keep formatting aligned with the current codebase style and avoid editing generated files under `demo/.valaxy` or build artifacts under `demo/dist`.

## Testing Guidelines
There is currently no dedicated test suite checked in. Treat `pnpm lint`, `pnpm typecheck`, and a successful `pnpm build` as the minimum validation set for every change. If you add tests later, prefer colocated `*.test.ts` or `*.spec.ts` files near the module they verify and use Vitest, which is already available in the workspace.

## Commit & Pull Request Guidelines
Follow the existing Conventional Commit style seen in history: `fix: ...`, `docs: ...`, `refactor: ...`, `chore: ...`. Keep subject lines short and action-oriented. PRs should include a clear summary, affected areas such as `theme/components` or `theme/styles`, linked issues when relevant, and screenshots or short recordings for visual changes to the demo site.

## Repository-Specific Notes
Do not commit generated output from local experiments unless the change intentionally updates demo artifacts. When adjusting theme behavior, verify the result through `pnpm dev` in the demo site before requesting review.
