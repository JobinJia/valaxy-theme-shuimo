/**
 * rAF 防抖：连续调用合并到下一帧只跑一次，trailing 语义。
 * 比 setTimeout 防抖更贴帧（resize/scroll 这类高频事件天然按帧推进），
 * tab hidden 时 rAF 暂停，回前台不会爆发补偿。
 *
 * schedule 接收的参数会覆盖前一次调度——和 setTimeout 防抖语义一致。
 */
export interface RafDebouncedHandle<Args extends any[]> {
  schedule: (...args: Args) => void
  cancel: () => void
}

export function rafDebounce<Args extends any[]>(
  fn: (...args: Args) => void,
): RafDebouncedHandle<Args> {
  let raf = 0
  return {
    schedule(...args: Args) {
      if (raf)
        cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        raf = 0
        fn(...args)
      })
    },
    cancel() {
      if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    },
  }
}
