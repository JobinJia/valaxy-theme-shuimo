# Changelog

本文件记录 `@jobinjia/valaxy-theme-shuimo` 各版本的变化。2.0.0 之前的历史见 git log。

## 2.0.3 — 2026-09-27

### 性能

- 去掉模块加载时对印章字体的预取。每个页面的 `<head>` 已经由 Valaxy 预加载了这份字体，额外的预取在慢速网络下可能赶在预加载完成前发出，导致字体被下载两遍。

## 2.0.2 — 2026-09-27

### 修复

- **未安装 `@napi-rs/canvas` 时主题配置加载失败**：2.0.0 / 2.0.1 在主题配置里直接导入了 `@napi-rs/canvas`，站点没装这个包时，整份主题 `valaxy.config.ts` 都加载不了。构建本身不报错，但字体裁剪、样式白名单等主题插件全部失效。现在只在生成 OG 图时才按需加载它，没装就跳过 OG 图并打印提示。**使用 2.0.0 / 2.0.1 的站点请升级。**
- **移动端首页的 hydration 不一致**：服务端按桌面布局渲染，手机上客户端一启动就切到移动布局，控制台报 “Hydration completed but contains mismatches”。现在在页面接管完成前按「尚未确定屏幕宽度」渲染，和服务端输出一致，接管后再切换。开屏幕布的上下 / 左右两组改用 CSS 媒体查询选择，脚本运行前遮挡方向就是对的。
- **移动端白白生成看不见的印章**：首页导航的桌面菜单印章和大印章在手机上也会生成（只是被 CSS 隐藏）。现在只生成当前屏幕看得见的那一套，手机首页导航印章从 7 枚降到 3 枚；桌面山水、农历时钟、右上角主题切换也只在确认是桌面后才挂载。

### 行为变化

- 新增导出 `useViewport()`，返回 `{ isMobile, isDesktop }`，两者在页面接管完成前都是 `false`。
- `useIsMobile()` 现在返回 `ComputedRef<boolean>`（之前是可写的 `ShallowRef`），并且在页面接管完成前恒为 `false`。如果你在自定义组件里用它决定渲染哪套布局，请改用 `useViewport()` 分别判断 `isMobile` / `isDesktop`。
- `useMediaQuery()` 同样在页面接管完成前返回 `false`。

## 2.0.1 — 2026-09-27

### 性能（移动端首页）

- 开屏幕布不再等移动端花卉画完。纸张、印章、幕布纸三项就绪后，最多再等花卉 400 ms；花卉晚到时在幕布后淡入。
- 移动端不再预热桌面山水的 worker（约 775 KB），桌面端也不再预热移动端花卉的 worker；移动端宣纸 worker 池从 3 个降到 2 个。
- 手机地址栏收起 / 展开引起的高度变化不再触发花卉重画，只有宽度变化才会重画；旧的生成结果晚到时直接丢弃。
- 幕布打开之后，窗口尺寸变化和亮暗切换不再重新生成幕布纸。
- 新增导出 `isMobileViewport()`：一次性、非响应式地判断当前是否为移动端断点。

## 2.0.0 — 2026-09-27

### 不兼容变化

- **需要 `@jobinjia/shuimo-core` `>=3.0.0`**（peer 依赖）。1.x 与 core 3 不兼容：core 3 的宣纸 worker 返回 `ImageBitmap` 而不是 PNG `Blob`。
- **首页山水构图变化**：主题现在把真实的场景高度交给 core 3 排布整幅构图，并在上方留出 1/4 高度的天空，避免主峰山尖被裁。`hero.sceneHeight` 的含义随之改变：调大调小都是**整体缩放构图**，不再是单纯露出更多天空或水面。800 比例最自然。
- **宣纸缓存全部失效一次**：缓存前缀从 `shuimo-xuan-paper-v2` 升到 `v3`，老访客首次访问会重新生成宣纸，旧版本的 localStorage 与幕布 IndexedDB 缓存会被清理。
- **`stamp.size` 默认值从 200 改为 56**，与参考尺寸一致。

### 新功能

- **水墨分享卡片**（`shareCard`）：文章页新增「分享」按钮与预览对话框，客户端实时渲染含印章的竖版卡片；构建时为每篇文章生成横版 OG 图并注入 `og:image` / `twitter:card`。每篇文章的画面在山水与应季花卉之间变化。需要 OG 图时安装 `@napi-rs/canvas` 并配置 `shareCard.titleFontPath`，详见 README。
- 开屏幕布的宣纸缓存到 IndexedDB，回访不再重新生成。

### 改进

- 宣纸以 JPEG（q0.9）缓存。core 3 的宣纸 PNG 约 2.7 MB，超过 localStorage 3 MB 上限，之前实际上从未缓存成功；JPEG 约 117 KB，肉眼无差别。带毛边的纸仍用 PNG 保留透明度。
- 宣纸 worker 直接使用传回的位图，单 worker 路径零拷贝上屏。
- 适配 `suncalc` 2（方位角改为以正北为 0、单位为度）。

### 升级指南（1.x → 2.x）

1. 升级依赖：

   ```bash
   pnpm add @jobinjia/valaxy-theme-shuimo@^2.0.3 @jobinjia/shuimo-core@^3
   ```

   请直接用 2.0.2 及以上版本，避开 2.0.0 / 2.0.1 在未安装 `@napi-rs/canvas` 时的配置加载问题。

2. 如果设置过 `hero.sceneHeight`，按新含义重新确认效果；不确定时删掉，用默认的 800。
3. 如果依赖旧的印章尺寸，显式设置 `stamp.size: 200`。
4. 需要构建时 OG 图：`pnpm add -D @napi-rs/canvas`，并在 `shareCard.titleFontPath` 指向一个本地中文 TTF/OTF 字体。不需要的话设 `shareCard.og: false`。
5. 印章配置请使用印章 v2 的字段（`mode`、`shape: 'rect'`、`border`、`carving`、`ink` 等）。`type` / `shape: 'rectangle'` 作为别名仍然兼容；1.x 早期的 `fontSize`、`columnSpacingPx`、`noiseAmountPx`、`textCarving`、`regularShape` 等印章 v1 参数不再生效。
