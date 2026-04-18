import type { Ref } from 'vue'
import { onMounted, onUnmounted, watch } from 'vue'

export interface ImageCaptionOptions {
  enable?: boolean
  autoNumbering?: boolean
  prefix?: string
}

export function useImageCaption(
  containerRef: Ref<HTMLElement | null | undefined>,
  options: Ref<ImageCaptionOptions>,
) {
  let cleanup: (() => void) | null = null

  function enhance() {
    revert()
    const container = containerRef.value
    if (!container || options.value.enable === false)
      return

    const imgs = container.querySelectorAll('img[alt]:not(.shuimo-figure img)')
    let index = 0

    imgs.forEach((img) => {
      const alt = img.getAttribute('alt')?.trim()
      if (!alt)
        return

      index++
      const figure = document.createElement('figure')
      figure.className = 'shuimo-figure'

      const caption = document.createElement('figcaption')
      caption.className = 'shuimo-figure__caption'

      const title = img.getAttribute('title')?.trim()
      const prefix = options.value.prefix || '图'
      const numberStr = options.value.autoNumbering !== false ? `${prefix} ${index}. ` : ''

      if (title && title !== alt) {
        caption.innerHTML = `<span class="shuimo-figure__caption-main">${numberStr}${alt}</span><span class="shuimo-figure__caption-sub">${title}</span>`
      }
      else {
        caption.textContent = `${numberStr}${alt}`
      }

      if (!img.parentNode)
        return
      img.parentNode.insertBefore(figure, img)
      figure.appendChild(img)
      figure.appendChild(caption)
    })

    cleanup = () => {
      const figures = container.querySelectorAll('.shuimo-figure')
      figures.forEach((figure) => {
        const img = figure.querySelector('img')
        if (img && figure.parentNode) {
          figure.parentNode.insertBefore(img, figure)
          figure.remove()
        }
      })
    }
  }

  function revert() {
    if (cleanup) {
      cleanup()
      cleanup = null
    }
  }

  onMounted(() => {
    setTimeout(enhance, 400)
  })

  onUnmounted(revert)

  watch(options, enhance, { deep: true })
}
