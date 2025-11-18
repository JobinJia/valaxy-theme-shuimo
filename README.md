<p align="center">
Valaxy-Theme-Shuimo<sup><em>(vue)</em></sup>
</p>

[![npm](https://img.shields.io/npm/v/valaxy-theme-shuimo)](https://www.npmjs.com/package/valaxy-theme-shuimo)
[![npm dev dependency version](https://img.shields.io/npm/dependency-version/valaxy-theme-shuimo/dev/valaxy)](https://github.com/YunYouJun/valaxy)

> A Chinese ink wash painting style theme for [valaxy](https://github.com/YunYouJun/valaxy).

## Installation

Install the theme in your Valaxy project:

```bash
pnpm add valaxy-theme-shuimo
# or
npm install valaxy-theme-shuimo
```

Then configure it in your `valaxy.config.ts`:

```ts
import { defineValaxyConfig } from 'valaxy'
import type { ThemeConfig } from 'valaxy-theme-shuimo'

export default defineValaxyConfig<ThemeConfig>({
  theme: 'shuimo',

  themeConfig: {
    // your theme config here
  },
})
```

## Features

- Chinese ink wash painting inspired design
- Fully responsive layout
- Dark mode support
- Customizable color scheme
- Built with Vue 3, Vite, and UnoCSS
- TypeScript support

## Development

### Clone to local

> Use [pnpm](https://pnpm.io/), because we need its workspace.

```bash
npx degit YunYouJun/valaxy-theme-shuimo valaxy-theme-shuimo

cd valaxy-theme-shuimo

# If you don't have pnpm installed
npm install -g pnpm

pnpm i
```

### Run development server

```bash
# dev node
pnpm dev
# dev client
pnpm demo
```

### Build

```bash
pnpm build
```

### Release

> Publish to [npm](https://www.npmjs.com/).

#### Manual

```bash
pnpm ci:publish
```

#### Auto by GitHub Actions

> You can release it by github actions.

Click `Settings` -> `Secrets` -> `Actions` in your GitHub repo.

Add `New repository secret`:

- `NPM_TOKEN`: `your npm token` (Generate from your npm `Access Tokens` - `Automation`)

```bash
npm run release
# choose your version to automatic release
```

## Thanks

Starter theme ref theme:

- [vuejs/blog](https://github.com/vuejs/blog)
- [tailwind-nextjs-starter-blog](https://github.com/timlrx/tailwind-nextjs-starter-blog)

### [Sponsors](https://sponsors.yunyoujun.cn)

<p align="center">
  <a href="https://sponsors.yunyoujun.cn">
    <img src='https://fastly.jsdelivr.net/gh/YunYouJun/sponsors/public/sponsors.svg'/>
  </a>
</p>
