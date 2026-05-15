# i18n 全仓收口 — 设计文档

**日期**：2026-05-15
**范围**：本周修复清单第 1/4 项
**前置**：2026 年 5 月版代码审查（见会话记录）

## 1. 背景

`grep -rn 'useI18n\|\$t(\|t(' theme/components/ theme/pages/ theme/layouts/ theme/App.vue` 结果为空——**没有一个 .vue 组件接入 valaxy 的 i18n**。但 `theme/locales/{zh-CN,en}.yml` 里已经定义了 18 条 key（`shuimo.back` / `shuimo.empty` / `shuimo.read_more` 等），全部未被使用。

结果是所有需要 i18n 的文案以"硬编码中文 fallback"形式散布在模板里，违反主题应支持 i18n 的合同。审查清单（B 类反模式）确认至少 5 类、15+ 处需要修。

## 2. 目标

1. 为所有需要文案的组件接入 valaxy 提供的 `useI18n()`。
2. 复用 locale 文件里已有的 5 个 key（`back` / `empty` / `read_more` / `powered_by` / `theme_name`）。
3. 新增缺失的 key，按语义分组（用户已批准）。
4. 删除一切硬编码中文 UI 文案兜底；保留配置 default 值与视觉装饰字。

## 3. 非目标（YAGNI）

- **不动配置 default 值**：`stamp.author || '墨'`、印章默认文本 `'受命,于天,既寿,永昌'`、字体名 `'峄山碑篆体'` 等是 schema default，不是 UI 文案。
- **不动视觉装饰字**：ThemeToggle 的 '月映/日照'、404 layout 的 stamp `text="迷"`、`ShuimoDate.vue` 的天干地支算法常量。
- **不动 Footer powered_by 的英文**（用户已批准保留 `Powered by Valaxy · Theme Shuimo` 不 i18n）。
- **不动 post.vue:135** `new Date(...).toLocaleDateString('zh-CN')`（用户未批准修改）。
- **不引入第三方 i18n**：valaxy 已内置 i18n，直接用其 `useI18n()`。
- **不动 demo/**：demo 是只读消费者。
- **不重排已有 key**：保持 `shuimo.back` / `shuimo.empty` 等扁平 key 不动；只新增 key 时按语义分组（与 `shuimo.astronomy.*` 命名风格一致）。

## 4. 判定准则

| 类型 | 例子 | 处理 |
|---|---|---|
| UI 文案 | 按钮 title、aria-label、空状态、占位、错误提示 | **i18n 化** |
| 配置 default | `stamp.author || '墨'`、`Stamp props default '受命,于天,既寿,永昌'` | 保留硬编码 |
| 视觉装饰汉字 | ThemeToggle stamp '月映'/'日照'、404 stamp '迷' | 保留硬编码 |
| 算法常量 | `ShuimoDate.vue` 天干地支数组、月相算法 | 保留硬编码 |

## 5. 待新增 locale key 与现有 key 调整

### 5.1 新增 key（13 条，按语义分组）

```yaml
shuimo:
  untitled: 无题 / Untitled
  back_to_top: 回到顶部 / Back to top
  archives_studio: 栖墨斋 / Studio                # 诗意别名，与 archives='归档' 区分
  post_count: '{count} 篇' / '{count} posts'      # 不做复数变位，0/1/n 同一形式
  not_found:
    title: 迷途 / Lost
    desc: 此路不通，山水之间，尚需寻觅。 / The path leads nowhere. Wander a while and find another way.
  series:
    nav_title: 本卷目录 / In this series
  theme:
    toggle_to_light: 切换亮色 / Switch to light
    toggle_to_dark: 切换暗色 / Switch to dark
  author:
    anonymous: 佚名 / Anonymous
  seed:
    label: seed / seed
    copy: 复制 seed / Copy seed
    copied: 已复制 / Copied
    refresh: 随机重生 / Regenerate
```

### 5.2 现有 key 字面修改

`theme/locales/zh-CN.yml`：`shuimo.categories: 类目` → `shuimo.categories: 分类`（统一为常用词；en 保持 `Categories` 不动）。

## 6. 替换清单（共 22 处）

### 6.1 复用已有 key（11 处）

| 文件:行 | 当前 | 替换为 |
|---|---|---|
| ShuimoAboutPage.vue:76 | `归去来兮 ←` | `{{ t('shuimo.back') }} ←` |
| ShuimoArchivesPage.vue:88 | `归去来兮 ←` | `{{ t('shuimo.back') }} ←` |
| ShuimoCategoryTagPage.vue:60 | `归去来兮 ←` | `{{ t('shuimo.back') }} ←` |
| pages/tags/index.vue:45 | `归去来兮 ←` | `{{ t('shuimo.back') }} ←` |
| pages/categories/index.vue:45 | `归去来兮 ←` | `{{ t('shuimo.back') }} ←` |
| ShuimoPostList.vue:30 | `暂无文章` | `t('shuimo.empty')` |
| ShuimoArchivesPage.vue:82 | `暂无文章` | `t('shuimo.empty')` |
| ShuimoCategoryTagPage.vue:54 | `暂无文章` | `t('shuimo.empty')` |
| ShuimoArticleCard.vue:35 | `阅读全文 →` | `t('shuimo.read_more')` |
| ShuimoAboutPage.vue:53 | `分类` | `t('shuimo.categories')`（依赖 5.2 zh 改字） |
| ShuimoAboutPage.vue:57 | `标签` | `t('shuimo.tags')` |

### 6.2 用新增 key（9 处）

| 文件:行 | 当前 | 替换为 |
|---|---|---|
| ShuimoCategoryTagPage.vue:49 | `post.title \|\| '无题'` | `post.title \|\| t('shuimo.untitled')` |
| ShuimoArchivesPage.vue:74 | `post.title \|\| '无题'` | 同上 |
| ShuimoSeriesNav.vue:27, 30 | `post.title \|\| '无题'` | 同上 |
| layouts/post.vue:130 | `frontmatter.title \|\| '无题'` | 同上 |
| ShuimoHelper.vue:48 | `title="回到顶部"` | `:title="t('shuimo.back_to_top')"` + `:aria-label` |
| layouts/404.vue:37, 40 | `迷途` / 副标题 | `t('shuimo.not_found.title')` / `.desc` |
| ShuimoSeriesNav.vue:10 | `本卷目录` | `t('shuimo.series.nav_title')` |
| ShuimoThemeToggle.vue:20 | `isDark ? '切换亮色' : '切换暗色'` | `t(isDark ? 'shuimo.theme.toggle_to_light' : 'shuimo.theme.toggle_to_dark')` |
| ShuimoAboutPage.vue:38 | `author?.name \|\| '佚名'` | `author?.name \|\| t('shuimo.author.anonymous')` |
| ShuimoSeedControl.vue:32 | `seed` | `t('shuimo.seed.label')` |
| ShuimoSeedControl.vue:37 | `copied ? '已复制' : '复制 seed'` | `t(copied ? 'shuimo.seed.copied' : 'shuimo.seed.copy')` |
| ShuimoSeedControl.vue:45 | `title="随机重生"` | `:title="t('shuimo.seed.refresh')"` |
| ShuimoArchivesPage.vue:56 | `栖墨斋` | `t('shuimo.archives_studio')` |
| ShuimoAboutPage.vue:49 | `栖墨斋` | `t('shuimo.archives_studio')` |
| ShuimoCategoryTagPage.vue:37 | `{{ posts.length }} 篇` | `t('shuimo.post_count', { count: posts.length })` |

### 6.3 删除而非替换

| 文件:行 | 当前 | 改为 |
|---|---|---|
| ShuimoHeader.vue:13 | `themeConfig?.header?.title \|\| siteConfig.title \|\| '墨韵书斋'` | `themeConfig?.header?.title \|\| siteConfig.title` |
| ShuimoVerticalNav.vue:68 | `themeConfig?.header?.title \|\| siteConfig.title \|\| '落梅听雪阁'` | 同上（siteConfig.title 是 valaxy 标配，不需兜底） |

## 7. 实现细节

- valaxy 自身没有暴露独立 `useI18n` wrapper；valaxy 内部依赖 `vue-i18n`，并通过 `@intlify/unplugin-vue-i18n` 把 yml 编译进 bundle。本主题已有先例（`layouts/404.vue:3`、`pages/tags/index.vue:4`、`pages/categories/index.vue:4`）：直接 `import { useI18n } from 'vue-i18n'`。新接的组件遵循同样模式。
- 在每个组件 `<script setup>` 顶部加 `const { t } = useI18n()`。
- 模板里用 `{{ t('shuimo.xxx') }}` 或 attribute 绑定 `:title="t(...)"`、`:aria-label="t(...)"`。
- locale 文件用 YAML，对齐缩进。每条新 key 必须同时在 zh-CN 和 en 出现。
- 模板里的"装饰箭头"如 `← / →` 保留在模板字符串，不进 locale（避免 i18n 字符串里嵌排版字符）。

## 8. 验证

实施后：
1. `grep -rn -E "['\"]([一-龥]+[^'\"]*?)['\"]" theme/components/ theme/pages/ theme/layouts/ theme/App.vue` 结果应只剩：
   - 配置 default 值（`'墨'`、`'受命,...'` 等）
   - 视觉装饰字（'月映'/'日照'/'迷'）
   - `ShuimoDate.vue` 算法常量
   - 注释中的示例
2. `pnpm typecheck` 通过。
3. `pnpm lint` 通过。
4. `pnpm dev` 启动 demo，肉眼检查中英切换。
5. `pnpm build` SSG 通过。
6. 单元测试：locale 文件新 key 在 zh-CN 与 en 一一对应（建议 `node/i18n.test.ts` 用 YAML 对比）。

## 9. 风险与回滚

- **valaxy 的 useI18n 行为**：需确认 valaxy 暴露的 `useI18n` 是 vue-i18n 标准 API 还是封装版（看 demo 怎么用）。若 valaxy 没暴露，回退到直接 `import { useI18n } from 'vue-i18n'`。需在实施第一步确认。
- **回滚成本**：i18n 收口纯模板/字符串改动，无运行时行为变更；按文件粒度可逐个 revert。
- **后续不增量回退**：本 PR 落地后，新增组件直接走 i18n，CI/lint 可加 hardcoded-CJK 防护（不在本次 scope）。

## 10. 完工标准

- 替换清单 6.1 + 6.2 + 6.3 全部执行。
- 新增 11 条 locale key 在 zh-CN 与 en 都存在。
- typecheck / lint / build 全绿。
- `git diff theme/locales/` 与 `git diff theme/components/` / `theme/pages/` / `theme/layouts/` / `theme/App.vue` 是本 PR 唯一改动。
