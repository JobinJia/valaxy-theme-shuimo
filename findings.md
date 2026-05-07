# 审查发现

## 当前发现

- `theme/components/ShuimoLayout.vue`：移动端首页不渲染
  `ShuimoHeroLandscape`，但 `tryOpenInitialCurtain()` 仍会在
  `heroLandscapeEnabled` 为真时等待 `heroPaperReady` / `landscapeReady`，导致移动端
  只能等 6s 兜底开幕。
- `theme/App.vue`、`theme/components/ShuimoLayout.vue`、
  `theme/components/ShuimoThemeToggle.vue`：移动端媒体查询逻辑重复，且 `App.vue` 通过
  `(window as any).__shuimo_app_mobile_mql` 存 listener，类型不安全并且多实例会互相覆盖。
- `theme/components/ShuimoMobileFlower.vue`：直接 `innerHTML` + `appendChild`
  操作 DOM，不符合 Vue 数据流；缓存声明在组件 setup 内，无法实现注释所说的 SPA
  路由切换复用；object URL 没有在替换时释放。
- `theme/components/ShuimoLayout.vue`：兜底 `setTimeout`
  没有在卸载时清理，组件卸载后仍可能触发全局 curtain 状态。
- `theme/types/index.d.ts` 与 `theme/components/ShuimoMobileFlower.vue`：
  `mobileFlower.opacity` 默认值说明和 fallback 不一致，配置语义不稳定。
- `theme/composables/useMobileFlower.ts`：移动端花卉仍使用 SVG 生成路径；用户反馈 SVG
  观感不佳，需要切换到 shuimo-core 的 Canvas 花卉算法。

## 候选问题

- 组件职责过宽。
- 模板内存在过多派生逻辑。
- composable API 边界不清晰。
- 类型声明与运行时代码重复或不同步。
