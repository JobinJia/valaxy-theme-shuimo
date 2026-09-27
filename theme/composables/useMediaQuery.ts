import type { ComputedRef, ShallowRef } from 'vue'
import { computed, getCurrentInstance, onMounted, onScopeDispose, shallowRef } from 'vue'

export const SHUIMO_MOBILE_MEDIA_QUERY = '(max-width: 767px)'

// The server has no viewport, so SSR renders every media query as "no match".
// The first client render must hydrate against that same markup, so while the
// app is hydrating real values are only read in onMounted. Once the app has
// mounted, components created later read them synchronously.
let hydrated = false

function afterHydration(fn: () => void): void {
  if (hydrated || !getCurrentInstance()) {
    fn()
    return
  }
  onMounted(() => {
    hydrated = true
    fn()
  })
}

export function useMediaQuery(query: string): ShallowRef<boolean> {
  const matches = shallowRef(false)

  if (typeof window === 'undefined')
    return matches

  const mediaQuery = window.matchMedia(query)

  function update(event: MediaQueryListEvent) {
    matches.value = event.matches
  }

  afterHydration(() => {
    matches.value = mediaQuery.matches
    mediaQuery.addEventListener('change', update)
  })
  onScopeDispose(() => {
    mediaQuery.removeEventListener('change', update)
  })

  return matches
}

/**
 * One-off, non-reactive check of the mobile breakpoint. For module-level code
 * (worker preheating) that runs before any component setup.
 */
export function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(SHUIMO_MOBILE_MEDIA_QUERY).matches
}

// One app-wide listener for the mobile breakpoint. Until it is known (SSR and
// hydration) both isMobile and isDesktop are false, so components that only
// belong to one layout are neither server-rendered nor mounted on the wrong
// device and thrown away a frame later.
const mobileMatches = shallowRef(false)
const viewportKnown = shallowRef(false)
const isMobileState = computed(() => viewportKnown.value && mobileMatches.value)
const isDesktopState = computed(() => viewportKnown.value && !mobileMatches.value)

function watchViewport(): void {
  if (viewportKnown.value)
    return
  const mediaQuery = window.matchMedia(SHUIMO_MOBILE_MEDIA_QUERY)
  mobileMatches.value = mediaQuery.matches
  viewportKnown.value = true
  mediaQuery.addEventListener('change', (event) => {
    mobileMatches.value = event.matches
  })
}

export function useViewport(): { isMobile: ComputedRef<boolean>, isDesktop: ComputedRef<boolean> } {
  if (typeof window !== 'undefined' && !viewportKnown.value)
    afterHydration(watchViewport)
  return { isMobile: isMobileState, isDesktop: isDesktopState }
}

export function useIsMobile(): ComputedRef<boolean> {
  return useViewport().isMobile
}
