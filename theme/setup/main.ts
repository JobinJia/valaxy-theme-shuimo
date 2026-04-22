import { defineAppSetup } from 'valaxy'
import { initBrushStyles } from '../composables/useBrushStyles'

export default defineAppSetup(({ router }) => {
  if (typeof window !== 'undefined') {
    router.isReady().then(() => {
      initBrushStyles()
    })
  }
})
