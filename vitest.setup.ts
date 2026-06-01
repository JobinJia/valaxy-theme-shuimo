// Test setup: polyfill the Web Animations API for jsdom.
//
// jsdom does not implement `Element.prototype.animate`. `useTimedCallback`
// uses it as a timeline-aware timer (timedCallback / intervalCallback), so
// any composable that schedules work through it (e.g. useAstronomy) throws
// `el.animate is not a function` under the jsdom test environment.
//
// Back it with `setTimeout` so vitest fake timers can drive `finish` events:
// `vi.advanceTimersByTime(ms)` then fires the animation's finish exactly like
// a real timeline would. The `setTimeout` global is read at call time, so it
// resolves to the faked timer when `vi.useFakeTimers()` is active.
//
// Node-environment test files have no `Element`; the guard skips them.

type FinishListener = () => void

if (typeof Element !== 'undefined' && typeof Element.prototype.animate !== 'function') {
  Element.prototype.animate = function animate(
    _keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
    options?: number | KeyframeAnimationOptions,
  ): Animation {
    const duration = typeof options === 'number' ? options : Number(options?.duration ?? 0)
    const listeners: FinishListener[] = []
    let timer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      timer = null
      for (const fn of [...listeners]) fn()
    }, Number.isFinite(duration) ? duration : 0)

    const anim: Partial<Animation> = {
      addEventListener: ((type: string, cb: EventListenerOrEventListenerObject) => {
        if (type === 'finish' && typeof cb === 'function')
          listeners.push(cb as FinishListener)
      }) as Animation['addEventListener'],
      removeEventListener: ((type: string, cb: EventListenerOrEventListenerObject) => {
        if (type === 'finish') {
          const i = listeners.indexOf(cb as FinishListener)
          if (i !== -1)
            listeners.splice(i, 1)
        }
      }) as Animation['removeEventListener'],
      cancel: () => {
        if (timer) {
          clearTimeout(timer)
          timer = null
        }
      },
      finish: () => {},
      play: () => {},
      pause: () => {},
    }
    return anim as Animation
  } as typeof Element.prototype.animate
}
