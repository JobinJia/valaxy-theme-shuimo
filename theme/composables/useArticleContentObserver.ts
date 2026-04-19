import type { Ref } from 'vue'
import { nextTick, onBeforeUnmount, onMounted, watch } from 'vue'

export function useArticleContentObserver(
  containerRef: Ref<HTMLElement | null | undefined>,
  onReady: () => void,
) {
  let observer: MutationObserver | null = null
  let rafId: number | null = null

  function resolveContainer() {
    const current = containerRef.value
    if (current)
      return current

    if (typeof document === 'undefined')
      return null

    const article = document.querySelector<HTMLElement>('.shuimo-post-page__content')
    if (article)
      containerRef.value = article

    return article
  }

  function runSoon() {
    if (typeof window === 'undefined')
      return

    if (rafId !== null)
      cancelAnimationFrame(rafId)

    rafId = requestAnimationFrame(() => {
      rafId = null
      onReady()
    })
  }

  async function bindObserver() {
    if (typeof MutationObserver === 'undefined')
      return

    observer?.disconnect()

    await nextTick()

    const container = resolveContainer()
    if (!container)
      return

    observer = new MutationObserver(() => {
      runSoon()
    })

    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    })

    runSoon()
  }

  onMounted(() => {
    bindObserver()
  })

  watch(containerRef, () => {
    bindObserver()
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    if (rafId !== null)
      cancelAnimationFrame(rafId)
  })
}
