import { defineAppSetup } from 'valaxy'
import { ref } from 'vue'
import { initBrushStyles } from '../composables/useBrushStyles'
import { CURRENT_ROUTE_PATH_KEY, ROUTER_KEY } from '../composables/useCurtainTransition'

export default defineAppSetup((ctx) => {
  // ctx.routePath is the SSG prerender path (vite-ssg passes it through valaxy's
  // createApp(routePath)). Under monorepo/link installs the consumer ships its
  // own vue-router copy, so calling useRoute()/useRouter() from theme code
  // injects under the theme-side symbol and misses the app-installed router.
  // Resolve the path here from ctx.router (the real one) and provide a reactive
  // ref kept in sync via afterEach; theme layouts inject it directly.
  const initial = ctx.routePath ?? (typeof window !== 'undefined' ? window.location.pathname : '/')
  const routePath = ref<string>(initial)
  ctx.app.provide(CURRENT_ROUTE_PATH_KEY, routePath)
  ctx.app.provide(ROUTER_KEY, ctx.router)

  if (typeof window === 'undefined')
    return

  ctx.router.afterEach((to) => {
    routePath.value = to.path
  })

  ctx.router.isReady().then(() => {
    initBrushStyles()
  })
})
