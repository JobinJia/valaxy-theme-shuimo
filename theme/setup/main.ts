import { nextTick } from 'vue'
import { defineAppSetup } from 'valaxy'
import { initBrushStyles } from '../composables/useBrushStyles'
import { closeCurtainTransition, openCurtainTransition, openInitialCurtain } from '../composables/useCurtainTransition'

export default defineAppSetup(({ router }) => {
  if (typeof window === 'undefined')
    return

  router.isReady().then(() => {
    initBrushStyles()
  })

  setTimeout(openInitialCurtain, 2500)

  let readyForTransition = false

  router.afterEach(() => {
    if (!readyForTransition) {
      readyForTransition = true
      return
    }
    nextTick(() => openCurtainTransition())
  })

  router.beforeEach(async () => {
    if (!readyForTransition)
      return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
      return
    await closeCurtainTransition()
  })
})
