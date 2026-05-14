import type { InjectionKey, Ref } from 'vue'
import type { Router } from 'vue-router'
import { ref } from 'vue'

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined')
    return false
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

export const curtainRevealed = ref(true)
export const curtainStampReady = ref(false)
// curtain wrapper 自己的 paper（带×3金屑密度，独立于 useGlobalXuanPaper 的页面
// 全局 paper）是否生成完成。由 App.vue 的 ensureCurtainPaperReady 完成时调用
// markCurtainPaperReady 触发。ShuimoLayout 的 tryOpenInitialCurtain 等这个信号，
// 防止 curtain 拉开时 wrapper 还显示纯色（洒金未出）。
export const curtainPaperReady = ref(false)

// Reactive route path provided by theme/setup/main.ts; theme layouts read it
// via inject() instead of useRoute()/useRouter() because under monorepo/link
// installs the consumer ships its own vue-router copy and the theme's symbol
// keys don't match the app-installed router's keys. Initial value equals the
// SSG ctx.routePath, and ctx.router.afterEach keeps it in sync on SPA nav.
export const CURRENT_ROUTE_PATH_KEY: InjectionKey<Ref<string>> = Symbol('shuimo-current-route-path')

// Same rationale as CURRENT_ROUTE_PATH_KEY: theme code that needs to imperatively
// navigate (back / push) can inject the actual ctx.router instead of calling
// useRouter() which returns undefined under duplicate vue-router instances.
export const ROUTER_KEY: InjectionKey<Router> = Symbol('shuimo-router')

let initialCurtainActive = false

// Call synchronously from App.vue's setup so each vite-ssg concurrent render
// captures its own curtainRevealed value before the template emits.
export function setupInitialCurtain(pathname: string) {
  const normalized = pathname.replace(/\/$/, '') || '/'
  const needsCurtain = normalized === '/' && !prefersReducedMotion()
  curtainRevealed.value = !needsCurtain
  initialCurtainActive = needsCurtain
}

export function openInitialCurtain() {
  if (!initialCurtainActive)
    return
  initialCurtainActive = false
  curtainRevealed.value = true
}

export function markCurtainStampReady() {
  curtainStampReady.value = true
}

export function markCurtainPaperReady() {
  curtainPaperReady.value = true
}
