import { onScopeDispose, shallowRef } from 'vue'

export const SHUIMO_MOBILE_MEDIA_QUERY = '(max-width: 767px)'

export function useMediaQuery(query: string) {
  const matches = shallowRef(false)

  if (typeof window === 'undefined')
    return matches

  const mediaQuery = window.matchMedia(query)
  matches.value = mediaQuery.matches

  function update(event: MediaQueryListEvent) {
    matches.value = event.matches
  }

  mediaQuery.addEventListener('change', update)
  onScopeDispose(() => {
    mediaQuery.removeEventListener('change', update)
  })

  return matches
}

export function useIsMobile() {
  return useMediaQuery(SHUIMO_MOBILE_MEDIA_QUERY)
}
