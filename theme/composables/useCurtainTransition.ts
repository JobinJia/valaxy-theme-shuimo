import { ref } from 'vue'

function isHomePath(): boolean {
  if (typeof window === 'undefined')
    return false
  const path = window.location.pathname.replace(/\/$/, '') || '/'
  return path === '/'
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined')
    return false
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

const needsInitialCurtain = isHomePath() && !prefersReducedMotion()

export const curtainRevealed = ref(!needsInitialCurtain)

let initialCurtainActive = needsInitialCurtain

export function openInitialCurtain() {
  if (!initialCurtainActive)
    return
  initialCurtainActive = false
  curtainRevealed.value = true
}
