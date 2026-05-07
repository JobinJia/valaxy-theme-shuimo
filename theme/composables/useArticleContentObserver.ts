import type { Ref } from 'vue'
import { nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import { rafDebounce } from './useRafDebounce'

export function useArticleContentObserver(
  containerRef: Ref<HTMLElement | null | undefined>,
  onReady: () => void,
) {
  let observer: MutationObserver | null = null

  // onReady 包一层 silent：执行期间断开 observer，避免 onReady 改 DOM 反过来触发
  // 自己（useImageCaption 包 figure 就是这种 self-mutation 死循环源头）
  function silentRun() {
    const container = containerRef.value
    observer?.disconnect()
    onReady()
    if (observer && container) {
      observer.observe(container, {
        childList: true,
        subtree: true,
      })
    }
  }

  const runSoon = rafDebounce(silentRun)

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

  async function bindObserver() {
    if (typeof MutationObserver === 'undefined')
      return

    observer?.disconnect()

    await nextTick()

    const container = resolveContainer()
    if (!container)
      return

    observer = new MutationObserver(() => {
      runSoon.schedule()
    })

    // 只听 childList + subtree（图片/标题增删）。characterData 会让每个 textNode
    // 字符变更都触发 callback，长文里成本很高且业务用不到（caption / TOC 都基于
    // 节点结构而非文字变化）
    observer.observe(container, {
      childList: true,
      subtree: true,
    })

    runSoon.schedule()
  }

  onMounted(() => {
    bindObserver()
  })

  watch(containerRef, () => {
    bindObserver()
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    runSoon.cancel()
  })
}
