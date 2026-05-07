import { ref } from 'vue'

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined')
    return false
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

export const curtainRevealed = ref(true)
export const curtainStampReady = ref(false)

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
