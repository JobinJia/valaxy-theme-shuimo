# Repository Guidelines

## 项目结构与模块组织
仓库基于 pnpm workspace，根目录保存统一脚本与配置；`theme/` 承载发布到 npm 的核心主题，实现位于 `client/`、`components/`、`layouts/`、`pages/` 与 `styles/`，同时通过 `locales/` 与 `types/` 维护多语言与类型边界；`node/` 目录存放与 Valaxy 生命周期挂钩的服务端钩子（如数据拉取、构建扩展），添加脚本时请维持纯 ESM；`demo/` 存放演示站点，复用主题作为本地 Playground，并提供 `pages/posts` 作为内容示例，可在 `demo/valaxy.config.ts` 中覆写主题配置；静态资源集中在 `theme/assets/`，UnoCSS 与通用配置分别在 `uno.config.ts` 与 `valaxy.config.ts` 中管理，通用常量可放 `theme/composables` 便于共享。

## 构建、测试与开发命令
- `pnpm install`：安装工作区依赖，确保 `theme` 与 `demo` 同步。
- `pnpm dev`：在根目录启动 demo 站点，便于主题联调。
- `pnpm demo`：仅运行 demo 客户端，适合检查内容层改动或验证多语言。
- `pnpm build`：调用 `build:demo` 生成 demo 静态包，用于预览与发布校验。
- `pnpm lint` / `pnpm typecheck`：分别运行 ESLint 与 vue-tsc，确保语法、类型与模板一致。
- `pnpm ci:publish`：工作区递归发布（需要预先配置 npm token），`npm run release` 则结合 bumpp 同步版本号。

## 编码风格与命名约定
默认采用 `@antfu/eslint-config`，配合 TypeScript 严格模式与 2 空格缩进；Vue 单文件组件推荐 `<script setup lang="ts">`，组件命名使用 `ShuimoXxx.vue`，可复用的组合式函数命名为 `useXxx`；样式主推 UnoCSS 原子类，需集中在 `theme/styles` 中定义主题 token 并善用 CSS 变量，同时将可复用配色落在 `:root` 变量以方便消费者覆写；Iconify 图标配置放在 `node/` 与 `assets/icons.ts`（若新增）保持可溯源，导入顺序遵循 `@` 开头别名在普通路径之前，提交前可运行 `pnpm lint --fix` 自动整理。

## 测试指南
当前以 vitest 作为轻量单元测试框架，可通过 `pnpm vitest run` 执行全部测试或 `pnpm vitest --ui` 进行交互调试；建议围绕复杂组件的渲染逻辑与数据格式化函数为单位撰写 `.spec.ts`，文件放置于被测模块旁；快照或交互测试可结合 `@vue/test-utils`，必要时使用 `pnpm vitest run --coverage` 输出覆盖率；提交前至少确保新特性具备 happy path 用例，并在 PR 描述中记录覆盖范围、待补案例或潜在缺口。

## 提交与 Pull Request 指南
提交信息遵循 Conventional Commits（如 `feat: add timeline card`），必要时补充影响范围或 BREAKING 说明，建议按 `type(scope): subject` 书写并以英文句首小写动词开头；功能性分支命名保持 `feature/`、`fix/`、`chore/` 前缀以便 CI 过滤；PR 需包含动机、主要改动列表、验证方式（命令输出、预览链接或截图），并在描述中关联 issue；涉及 UI 的改动提供 before/after 截图，涉及配置的改动需列出潜在风险与回滚策略，若影响生产请补充部署检查清单。

## 安全与配置提示
主题的外露配置集中在 `theme/valaxy.config.ts` 与 `demo/valaxy.config.ts`，更新站点级开关前请确认不会影响默认主题，配置项需提供默认值并写明用途；`uno.config.ts` 与 `eslint.config.js` 属全局文件，修改需考虑 workspace 共享影响，可先在 `demo` 中验证再回写；发布前检查 `package.json` 的 `exports` 与 `types` 指向是否仍指向 `client`/`types`，避免破坏消费者导入路径，并确认未意外携带 demo 依赖或敏感环境变量。

