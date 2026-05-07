import { onMounted, onUnmounted } from 'vue'

/**
 * setTimeout / setInterval 的等价替代：基于 Web Animations API 的空动画，
 * tab 隐藏时随 document.timeline 暂停，回调不前进；tab 切回继续。
 * setTimeout 在 hidden tab 会 throttle 但不停。提示气泡自动消失之类的 UI 反馈
 * 期望"看不见就别推进"，这里的语义比 setTimeout 更合适。
 */
export interface TimedCallbackHandle {
  cancel: () => void
}

const NOOP_KEYFRAMES: Keyframe[] = [{}, {}]
let sharedSentinel: HTMLDivElement | null = null

function getSentinel(): HTMLDivElement | null {
  if (typeof document === 'undefined')
    return null
  if (sharedSentinel && sharedSentinel.isConnected)
    return sharedSentinel
  sharedSentinel = document.createElement('div')
  sharedSentinel.setAttribute('aria-hidden', 'true')
  sharedSentinel.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none'
  document.body.appendChild(sharedSentinel)
  return sharedSentinel
}

export function timedCallback(ms: number, cb: () => void): TimedCallbackHandle {
  if (ms <= 0) {
    cb()
    return { cancel: () => {} }
  }
  const el = getSentinel()
  if (!el) {
    // SSR — 立即跑回调（保证最终一定到位，这点和 setTimeout 不同；
    // SSR 阶段 ms 等待没有意义）
    cb()
    return { cancel: () => {} }
  }
  let cancelled = false
  const anim = el.animate(NOOP_KEYFRAMES, { duration: ms })
  anim.addEventListener('finish', () => {
    if (!cancelled)
      cb()
  })
  return {
    cancel: () => {
      cancelled = true
      anim.cancel()
    },
  }
}

/**
 * setInterval 的等价替代：链式调度空动画，tab hidden 时随 timeline 暂停。
 * 注意每次 tick 间隔 = ms + cb 执行时间（不是绝对周期），cb 阻塞会累积漂移。
 */
export function intervalCallback(ms: number, cb: () => void): TimedCallbackHandle {
  if (typeof document === 'undefined' || ms <= 0)
    return { cancel: () => {} }

  let cancelled = false
  let currentAnim: Animation | null = null

  const schedule = () => {
    if (cancelled)
      return
    const el = getSentinel()
    if (!el)
      return
    currentAnim = el.animate(NOOP_KEYFRAMES, { duration: ms })
    currentAnim.addEventListener('finish', () => {
      if (cancelled)
        return
      cb()
      schedule()
    })
  }

  schedule()

  return {
    cancel: () => {
      cancelled = true
      currentAnim?.cancel()
      currentAnim = null
    },
  }
}

/**
 * 组件作用域版的 intervalCallback：onMounted 起、onUnmounted 自动 cancel。
 * 只在组件 setup() 里用；模块级 singleton 仍用 intervalCallback 自己管生命周期。
 */
export function useInterval(ms: number, cb: () => void) {
  let handle: TimedCallbackHandle | null = null
  onMounted(() => {
    handle = intervalCallback(ms, cb)
  })
  onUnmounted(() => {
    handle?.cancel()
    handle = null
  })
}

/**
 * trailing debounce：连续调用期间持续 reset 计时，最后一次调用 ms 后才真跑。
 * 适合 resize / input 这类高频事件——事件停止后才执行重活。
 * 接口和 rafDebounce 一致，可互换。
 */
export function timedDebounce<Args extends any[]>(
  fn: (...args: Args) => void,
  ms: number,
) {
  let handle: TimedCallbackHandle | null = null
  return {
    schedule(...args: Args) {
      handle?.cancel()
      handle = timedCallback(ms, () => {
        handle = null
        fn(...args)
      })
    },
    cancel() {
      handle?.cancel()
      handle = null
    },
  }
}
