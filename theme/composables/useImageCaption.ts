/**
 * useImageCaption — Composable that enhances article images with figure captions.
 *
 * Scans a container element for `<img>` tags with `alt` text, wraps each in a
 * `<figure>` element, and appends a `<figcaption>` with optional auto-numbering.
 *
 * The DOM changes are reverted automatically on component unmount or when
 * options change (the composable re-runs the enhancement).
 *
 * Images without alt text are left untouched.
 */
import type { Ref } from 'vue'
import { onMounted, onUnmounted, watch } from 'vue'

export interface ImageCaptionOptions {
  enable?: boolean
  autoNumbering?: boolean
  /** Numbering prefix, e.g. "图" or "Fig." */
  prefix?: string
}

export function useImageCaption(
  containerRef: Ref<HTMLElement | null | undefined>,
  options: Ref<ImageCaptionOptions>,
) {
  let cleanup: (() => void) | null = null

  /** Wrap qualifying images in <figure>/<figcaption> elements. */
  function enhance() {
    revert()
    const container = containerRef.value
    if (!container || options.value.enable === false)
      return

    // Select images with alt text that haven't already been wrapped
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

      if (options.value.autoNumbering !== false) {
        const prefix = options.value.prefix || '图'
        caption.textContent = `${prefix} ${index}. ${alt}`
      }
      else {
        caption.textContent = alt
      }

      if (!img.parentNode)
        return
      img.parentNode.insertBefore(figure, img)
      figure.appendChild(img)
      figure.appendChild(caption)
    })

    // Store a cleanup function that reverses the DOM changes
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

  /** Revert any previous DOM changes. */
  function revert() {
    if (cleanup) {
      cleanup()
      cleanup = null
    }
  }

  // Delay enhancement to ensure images are rendered
  onMounted(() => {
    setTimeout(enhance, 400)
  })

  onUnmounted(revert)

  // Re-enhance when options change (e.g. toggling numbering)
  watch(options, enhance, { deep: true })
}
