import { defineAppSetup } from 'valaxy'
import { initBrushStyles } from '../composables/useBrushStyles'

export default defineAppSetup(({ router }) => {
  // 在客户端初始化时生成笔触 CSS 变量
  if (typeof window !== 'undefined') {
    router.isReady().then(() => {
      initBrushStyles()
    })
  }
})
