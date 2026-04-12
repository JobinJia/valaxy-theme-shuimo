import type { InjectionKey, Ref } from 'vue'
import { inject, provide, ref } from 'vue'

type BlankSide = 'left' | 'right'

interface BlankSideContext {
  blankSide: Ref<BlankSide>
  setBlankSide: (side: BlankSide) => void
}

const BLANK_SIDE_KEY: InjectionKey<BlankSideContext> = Symbol('blankSide')

/**
 * 在 ShuimoLayout 中调用，provide 给所有后代组件
 */
export function provideBlankSide() {
  const blankSide = ref<BlankSide>('left')

  const ctx: BlankSideContext = {
    blankSide,
    setBlankSide: (side: BlankSide) => {
      blankSide.value = side
    },
  }

  provide(BLANK_SIDE_KEY, ctx)
  return ctx
}

/**
 * 在后代组件中 inject blankSide
 */
export function useBlankSide() {
  const ctx = inject(BLANK_SIDE_KEY)
  if (!ctx)
    throw new Error('useBlankSide() must be used inside ShuimoLayout')
  return ctx
}
