# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **valaxy-theme-shuimo** (`@jobinjia/valaxy-theme-shuimo`), a Chinese ink-wash (水墨) style theme for the [Valaxy](https://github.com/YunYouJun/valaxy) static blog framework. It features xuan paper textures, brush stroke effects, seal stamps, seasonal decorations, and traditional Chinese typography.

The optional peer dependency `@jobinjia/shuimo-core` provides canvas-based drawing for xuan paper textures and ink-wash elements.

## Commands

```bash
pnpm dev          # Run demo site in dev mode (valaxy dev server)
pnpm build        # Build demo site with SSG
pnpm lint         # ESLint (antfu config + UnoCSS + formatters)
pnpm typecheck    # vue-tsc type checking
pnpm release      # Bump version and publish theme to npm
```

## Monorepo Structure

pnpm workspace with two packages:

- **`theme/`** — The theme package published as `@jobinjia/valaxy-theme-shuimo`
- **`demo/`** — Demo/preview site consuming the theme via `workspace:*`

## Theme Architecture

Valaxy themes follow a convention-based structure. Key directories in `theme/`:

| Directory      | Purpose                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------- |
| `node/`        | Server-side: default theme config, Vite plugin, UnoCSS safelist generation                   |
| `client/`      | Client entry — re-exports composables                                                        |
| `setup/`       | App setup hook — initializes brush stroke CSS variables on client                            |
| `layouts/`     | Valaxy layouts: `default`, `home`, `post`, `404`                                             |
| `components/`  | Vue SFCs prefixed with `Shuimo*` (header, footer, sidebar, article cards, decorations, etc.) |
| `composables/` | Vue composables for brush styles, seed-based RNG, caching, scheduling                        |
| `styles/`      | SCSS — CSS variables (`css-vars.scss`), layout, markdown, xuan paper styles                  |
| `pages/`       | File-based routes: index, archives, categories, tags                                         |
| `types/`       | `ThemeConfig` interface extending Valaxy's `DefaultTheme.Config`                             |
| `locales/`     | i18n (zh-CN, en)                                                                             |

### Config Flow

`valaxy.config.ts` (theme root) → calls `defineTheme<ThemeConfig>()` → merges `defaultThemeConfig` from `node/index.ts`, registers the Vite plugin, and generates UnoCSS safelist from nav icons.

### Key Composables

- `useBrushStyles` — Generates randomized brush stroke CSS custom properties
- `useShuimoSeed` — Deterministic seed-based RNG for consistent visual randomness
- `useShuimoCache` / `useShuimoScheduler` — Performance utilities for canvas operations

## Tech Stack

- **Vue 3** (Composition API, `<script setup>`)
- **UnoCSS** with presets: Uno, Attributify, Icons, Typography + directives/variant-group transformers
- **SCSS** for theme styles
- **ESLint** via `@antfu/eslint-config` (no Prettier — uses eslint-plugin-format)
- **TypeScript** with `vue-tsc`
