import { defineAppSetup } from 'valaxy'
import { initBrushStyles } from '../composables/useBrushStyles'
import { INITIAL_ROUTE_PATH_KEY } from '../composables/useCurtainTransition'

export default defineAppSetup((ctx) => {
  // ctx.routePath is the SSG prerender path (vite-ssg passes it through valaxy's
  // createApp(routePath)); useRoute() inside App.vue can be undefined under
  // duplicate vue-router instances, so resolve it here and inject the result.
  const path = ctx.routePath ?? (typeof window !== 'undefined' ? window.location.pathname : '/')
  ctx.app.provide(INITIAL_ROUTE_PATH_KEY, path)

  if (typeof window === 'undefined')
    return

  ctx.router.isReady().then(() => {
    initBrushStyles()
  })
})
