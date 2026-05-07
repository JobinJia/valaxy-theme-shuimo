import type { TimedCallbackHandle } from './useTimedCallback'
import { onUnmounted, ref } from 'vue'
import { timedCallback } from './useTimedCallback'

/**
 * 临时提示消息：调 flash(text, ms) 设值，到时自动清空。重复调会重置计时。
 * 组件卸载时自动 cancel 已挂起的 timer。
 */
export function useFlashMessage(defaultMs = 3000) {
  const message = ref<string | null>(null)
  let handle: TimedCallbackHandle | null = null

  function flash(text: string, ms = defaultMs) {
    message.value = text
    handle?.cancel()
    handle = timedCallback(ms, () => {
      message.value = null
      handle = null
    })
  }

  onUnmounted(() => {
    handle?.cancel()
    handle = null
  })

  return { message, flash }
}
