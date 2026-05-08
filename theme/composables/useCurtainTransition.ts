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

let initialCurtainActive = false

// Call synchronously from the root component's setup so each SSG-prerendered
// route captures the correct curtain state (closed on home, open elsewhere);
// SSR has no window, so the old module-top approach always produced "open".
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
