# a11y 收口 — 设计文档

**日期**：2026-05-15
**范围**：本周修复清单第 2/4 项
**前置**：i18n PR（已合并 main, 16 commits）。仍需走 `import { useI18n } from 'vue-i18n'` 配套补 aria-label / nav label 的国际化。

## 1. 背景

2026-05 代码审查 D 类反模式：5 处「返回」链接用 `<a href="#" @click.prevent="goBack">` 当 button 用，键盘焦点、屏幕阅读器、middle-click 全坏。
同审查还发现：4 处 `<button>` 缺 `type` 属性、2 处 icon-only button 仅靠 `:title` 暴露语义、Toc 移动端 toggle 缺 `aria-expanded`/`aria-controls`、`<header><nav>` 裸语义。

## 2. 目标

1. 把 5 处 `<a href="#">` 改成 `<button type="button">`，靠各组件已有的 `__back` class + 局部 reset 维持视觉不变。
2. 给现有 `<button>` 全仓补 `type="button"` 防 form context 误触。
3. 给 icon-only / 视觉无文字的 button 补 `:aria-label`（复用 i18n key）。
4. Toc 移动 toggle 实现 ARIA disclosure pattern：`aria-expanded` + `aria-controls` + panel 加 id。
5. 给 `<header><nav>` 加 `:aria-label`，新增一条 locale key `shuimo.nav.label`。

## 3. 非目标（YAGNI）

- **不动**链接颜色、hover/focus 视觉风格——只 reset button 默认 padding/border/background，不改链接观感。
- **不引入** focus-visible 全局策略——超出 a11y PR 范围，留给后续 UX PR。
- **不改** ShuimoLunarClock hover-only 显示问题（移动端可发现性）——属于交互模式重构，不是 a11y 标签补全。
- **不改** ShuimoHeroLandscape `body > svg` 盲删——属于副作用控制，不是 a11y。
- **不动** ShuimoSeedControl 的 `window.location.reload()` 反模式（另一个 PR 处理）。
- **不动** anchor→button 涉及的"删除 `href`"导致的 `:hover` SCSS 选择器破坏——button 的 `:hover` 一样能命中。

## 4. 替换 / 补全清单

### 4.1 anchor → button（5 处，核心）

| 文件:行 | 当前 | 改为 |
|---|---|---|
| ShuimoAboutPage.vue:75 | `<a href="#" class="shuimo-about-page__back" @click.prevent="goBack">` | `<button type="button" class="shuimo-about-page__back" @click="goBack">` |
| ShuimoArchivesPage.vue:87 | `<a href="#" class="shuimo-archives-page__back" @click.prevent="goBack">` | `<button type="button" class="shuimo-archives-page__back" @click="goBack">` |
| ShuimoCategoryTagPage.vue:59 | `<a href="#" class="shuimo-cat-tag-page__back" @click.prevent="goBack">` | `<button type="button" class="shuimo-cat-tag-page__back" @click="goBack">` |
| pages/tags/index.vue:44 | `<a href="#" class="shuimo-tags-index__back" @click.prevent="goBack">` | `<button type="button" class="shuimo-tags-index__back" @click="goBack">` |
| pages/categories/index.vue:44 | `<a href="#" class="shuimo-categories-index__back" @click.prevent="goBack">` | `<button type="button" class="shuimo-categories-index__back" @click="goBack">` |

每个 `__back` selector 在自己的 `<style lang="scss" scoped>` 加 button reset：

```scss
&__back {
  // 既有规则保持：font-size / color / letter-spacing / font-family / transition
  // 新增 button reset：
  border: 0;
  background: none;
  padding: 0;
  cursor: pointer;
  // 其他既有规则保持
}
```

具体 reset 注入位置：每个文件的 `&__back { … }` 块顶部加 `border: 0; background: none; padding: 0; cursor: pointer;`，其余规则不动。

### 4.2 `type="button"` 补全（2 文件 × 3 button）

| 文件:行 | 当前 | 改为 |
|---|---|---|
| ShuimoSeedControl.vue:34 | `<button class="shuimo-seed-control__btn"` | `<button type="button" class="shuimo-seed-control__btn"` |
| ShuimoSeedControl.vue:43 | `<button class="shuimo-seed-control__btn"` | 同上 |
| ShuimoThemeToggle.vue:18 | `<button` | `<button type="button"` |

（ShuimoCelestialPill.vue:36 实际已有 `type="button"`——审查报告把它列为 "缺 aria-label" minor，但 a11y 改动是 §4.3 范围。ShuimoToc.vue:209 的 `<button>` 也缺 `type="button"`，但 disclosure 改动在 §4.4 整段呈现，不在此重复列出。ShuimoHelper 已在 i18n PR 加过 `type="button"`，不再列。）

### 4.3 `:aria-label` 补全（icon-only / 短视觉文本，3 处）

| 文件:行 | 备注 | 改为 |
|---|---|---|
| ShuimoThemeToggle.vue:18 | 内含 ShuimoStamp 视觉，无可访问文本 | 加 `:aria-label="t(isDark ? 'shuimo.theme.toggle_to_light' : 'shuimo.theme.toggle_to_dark')"`（复用 i18n key） |
| ShuimoSeedControl.vue:34 | icon `⎘`/`✓` 复制按钮 | 加 `:aria-label="t(copied ? 'shuimo.seed.copied' : 'shuimo.seed.copy')"` |
| ShuimoSeedControl.vue:43 | icon `↻` 刷新按钮 | 加 `:aria-label="t('shuimo.seed.refresh')"` |

ShuimoHelper 已在 i18n PR 加过 `:aria-label`，不再列。

### 4.4 Toc 移动 toggle disclosure pattern

`ShuimoToc.vue:209-228` 的移动 toggle：

```diff
-      <button class="shuimo-toc__toggle" @click="mobileOpen = !mobileOpen">
+      <button
+        type="button"
+        class="shuimo-toc__toggle"
+        :aria-expanded="mobileOpen"
+        aria-controls="shuimo-toc-mobile-panel"
+        @click="mobileOpen = !mobileOpen"
+      >
         {{ t('shuimo.toc_title') }}
         <span class="shuimo-toc__arrow" :class="{ 'shuimo-toc__arrow--open': mobileOpen }">▾</span>
       </button>
       <Transition name="shuimo-toc-slide">
-        <ul v-if="mobileOpen" class="shuimo-toc__list">
+        <ul v-if="mobileOpen" id="shuimo-toc-mobile-panel" class="shuimo-toc__list">
```

id 用全 doc 唯一名称，避免和其它 Toc instance 冲突。如果同页面会出现多个 Toc instance，需要改 `useId()`——但当前只有一个，先用静态 id。

### 4.5 Header `<nav>` aria-label

新增 locale key（5.1 节）后：

```diff
-    <nav v-if="themeConfig?.nav?.length" class="shuimo-header__nav">
+    <nav v-if="themeConfig?.nav?.length" :aria-label="t('shuimo.nav.label')" class="shuimo-header__nav">
```

ShuimoHeader.vue 之前未引入 `useI18n`，需要补 `import { useI18n } from 'vue-i18n'` + `const { t } = useI18n()`。

## 5. locale key 增量

### 5.1 新增 1 条

```yaml
# zh-CN.yml
shuimo:
  nav:
    label: 站内导航
# en.yml
shuimo:
  nav:
    label: Site navigation
```

`locales.test.ts` parity 测试自动覆盖。

## 6. 实现策略

- 每文件一 commit，与 i18n PR 同节奏。
- 共 8 个文件改动 + 2 个 locale yml：5 个 `__back` 转换 + ShuimoToc + ShuimoThemeToggle + ShuimoSeedControl + ShuimoHeader + locale。
- ShuimoSeedControl 同时含 type="button" + aria-label 补全 → 一个 commit 覆盖。
- ShuimoThemeToggle 同理。
- ShuimoToc disclosure + type="button" → 一个 commit。
- ShuimoHeader 加 useI18n + nav aria-label → 一个 commit。
- locale 加 key + commit。

总计 10 个 commits（5 个 anchor→button + ShuimoToc + ShuimoThemeToggle + ShuimoSeedControl + ShuimoHeader + locale）。

## 7. 验证

实施后：
1. `grep -rn '<a href="#"' theme/components/ theme/pages/` → 应为空。
2. `grep -rnE '<button(\s+[^>]*)?>$|<button class' theme/components/ theme/layouts/` 已加 `type` → 空（grep flag adjusted to ignore lines that contain `type="button"`）。
3. `pnpm test theme/locales/locales.test.ts` → 仍 2 passed（新 key parity）。
4. `pnpm typecheck` 通过（pre-existing valaxy node_modules 错误除外）。
5. `pnpm lint` 通过。
6. `pnpm build` SSG 通过。
7. 手测：
   - Tab 键能聚焦到 5 处「归去来兮」按钮，按 Enter/Space 触发返回。
   - VoiceOver/NVDA 朗读「归去来兮」按钮为「按钮」而非「链接」。
   - 移动端 Toc 展开按钮朗读为「目录 按钮 折叠/展开」。
   - ThemeToggle、SeedControl 三按钮屏幕阅读器读出正确语义。

## 8. 风险与回滚

- **视觉风险**：button reset 漏掉某条 CSS 属性可能让按钮看起来异常。每个 `__back` block 都加同一组 reset 行；diff 可视。
- **回滚成本**：纯 template + 局部 SCSS reset 改动，无运行时行为变更；按文件粒度可逐个 revert。
- **`<a href>` 删后是否影响 SSG 抓取**：不影响——`<a href="#" @click.prevent>` 的 `#` 锚点对 SSG 路由无意义；改 button 后无后果。

## 9. 完工标准

- §4 替换清单全部执行。
- §5 1 条新 locale key 双语就位。
- typecheck / lint / test / build 全绿。
- 手测 5 处返回按钮可键盘聚焦 + 触发。
