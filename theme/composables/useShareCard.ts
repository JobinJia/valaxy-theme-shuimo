// theme/composables/useShareCard.ts
//
// Client-side composable that renders a share card using @jobinjia/shuimo-core
// and exposes render / download / copyToClipboard.

import type { ResolveCardSpecInput } from '../shareCard/resolveCardSpec'
import type { ComposeDeps } from '../shareCard/types'
import { ref } from 'vue'
import yishanFontUrl from '../assets/fonts/yishanbeizhuanti.woff2?url'
import { composeShareCard } from '../shareCard/composeShareCard'
import { resolveCardSpec } from '../shareCard/resolveCardSpec'

// Module-level singleton: build ComposeDeps only once per page lifetime.
let depsPromise: Promise<ComposeDeps | null> | null = null

/** Split seal text on commas (ASCII + CJK), trimming whitespace. */
function parseStampText(text: string): string[] {
  return text.split(/[,，]/).map(s => s.trim()).filter(Boolean)
}

/** Lazy-load @jobinjia/shuimo-core and assemble the browser ComposeDeps. */
async function loadComposeDeps(): Promise<ComposeDeps | null> {
  if (depsPromise)
    return depsPromise

  depsPromise = (async () => {
    try {
      const [elements, drawing] = await Promise.all([
        import('@jobinjia/shuimo-core/elements'),
        import('@jobinjia/shuimo-core/drawing'),
      ])

      const deps: ComposeDeps = {
        drawXuanPaper(ctx, spec) {
          const paper = elements.xuanPaper({
            width: spec.width,
            height: spec.height,
            seed: spec.seed,
            mode: 'canvas',
          })
          ctx.drawImage(paper, 0, 0)
        },

        drawMountain(ctx, spec, box) {
          const out = drawing.InkMount.generate({
            width: box.w,
            height: box.h,
            seed: spec.seed,
          })
          if (out.type === 'canvas')
            ctx.drawImage(out.canvas, box.x, box.y)
          else
            ctx.drawImage(out.bitmap, box.x, box.y)
        },

        async drawStampPath(ctx, spec, box) {
          if (!spec.stamp?.text)
            return

          const seal = await drawing.generateCanvasStampAsync({
            text: parseStampText(spec.stamp.text),
            type: spec.stamp.mode,
            color: spec.stamp.color,
            fontSize: 120,
            fontUrl: yishanFontUrl,
            seed: spec.seed,
          })

          // Fit the seal inside the target box while preserving aspect ratio.
          const scale = Math.min(box.w / seal.width, box.h / seal.height)
          const w = seal.width * scale
          const h = seal.height * scale
          ctx.drawImage(
            seal,
            box.x + (box.w - w) / 2,
            box.y + (box.h - h) / 2,
            w,
            h,
          )
        },
      }

      return deps
    }
    catch {
      // Optional peer dependency absent — degrade gracefully.
      return null
    }
  })()

  return depsPromise
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface UseShareCardOptions {
  slug: string
  frontmatter: Record<string, unknown>
  themeConfig: Record<string, unknown>
}

export function useShareCard(opts: UseShareCardOptions) {
  /** null = not yet checked, true = shuimo-core available, false = absent */
  const available = ref<boolean | null>(null)
  const generating = ref(false)
  /** Blob URL pointing to the most recently rendered PNG. Caller must revoke on unmount. */
  const previewUrl = ref<string | null>(null)
  const error = ref<string | null>(null)

  async function render(variant: 'portrait' | 'landscape' = 'portrait'): Promise<Blob | null> {
    generating.value = true
    error.value = null
    try {
      const deps = await loadComposeDeps()
      available.value = deps != null
      if (!deps)
        return null

      const spec = resolveCardSpec({
        slug: opts.slug,
        variant,
        frontmatter: opts.frontmatter as ResolveCardSpecInput['frontmatter'],
        themeConfig: opts.themeConfig as ResolveCardSpecInput['themeConfig'],
      })

      // Prefer OffscreenCanvas (no DOM involvement); fall back to HTMLCanvasElement.
      const canvas: OffscreenCanvas | HTMLCanvasElement
        = typeof OffscreenCanvas !== 'undefined'
          ? new OffscreenCanvas(spec.width, spec.height)
          : Object.assign(document.createElement('canvas'), { width: spec.width, height: spec.height })

      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null
      if (!ctx)
        throw new Error('2d context unavailable')

      await composeShareCard(spec, ctx, deps)

      const blob = canvas instanceof OffscreenCanvas
        ? await canvas.convertToBlob({ type: 'image/png' })
        : await new Promise<Blob>((resolve, reject) => {
            (canvas as HTMLCanvasElement).toBlob(
              b => b ? resolve(b) : reject(new Error('toBlob returned null')),
              'image/png',
            )
          })

      // Revoke the previous preview URL before creating a new one.
      if (previewUrl.value)
        URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = URL.createObjectURL(blob)

      return blob
    }
    catch (e) {
      error.value = (e as Error).message
      return null
    }
    finally {
      generating.value = false
    }
  }

  async function download(variant?: 'portrait' | 'landscape'): Promise<void> {
    const blob = await render(variant)
    if (!blob)
      return

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${opts.slug.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'share'}.png`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function copyToClipboard(variant?: 'portrait' | 'landscape'): Promise<boolean> {
    const blob = await render(variant)
    if (!blob || !navigator.clipboard?.write)
      return false

    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    return true
  }

  return {
    available,
    generating,
    previewUrl,
    error,
    render,
    download,
    copyToClipboard,
  }
}
