import { inject } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTER_KEY } from './useCurtainTransition'

export function useGoBack() {
  // Prefer the injected router from theme/setup/main.ts: under monorepo/link
  // installs useRouter() can return undefined here (duplicate vue-router →
  // routerKey symbol mismatch). useRouter() is kept as a fallback for cases
  // where the theme is consumed without the provide wiring.
  const injected = inject(ROUTER_KEY, null)
  const router = injected ?? useRouter()

  function goBack() {
    if (window.history.length > 1) {
      if (router)
        router.back()
      else
        window.history.back()
    }
    else if (router) {
      router.push('/')
    }
    else {
      window.location.assign('/')
    }
  }

  return { goBack }
}
