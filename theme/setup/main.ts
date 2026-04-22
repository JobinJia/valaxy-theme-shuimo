import { defineAppSetup } from 'valaxy'
import { initBrushStyles } from '../composables/useBrushStyles'
import { openInitialCurtain } from '../composables/useCurtainTransition'

export default defineAppSetup(({ router }) => {
  if (typeof window === 'undefined')
    return

  router.isReady().then(() => {
    initBrushStyles()
  })

  setTimeout(openInitialCurtain, 2500)
})
