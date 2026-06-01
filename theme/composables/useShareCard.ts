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

        drawScene(ctx, spec, box) {
          if (spec.scene === 'flower') {
            const flower = drawing.generateFlowerCanvas({
              seed: spec.seed,
              type: spec.flowerType,
              width: box.w,
              height: box.h,
              background: 'none',
            })
            ctx.drawImage(flower, box.x, box.y)
          }
          else {
            const out = drawing.InkMount.generate({ width: box.w, height: box.h, seed: spec.seed, layers: 6, mist: { coverage: 0.6 } })
            if (out.type === 'canvas')
              ctx.drawImage(out.canvas, box.x, box.y)
            else
              ctx.drawImage(out.bitmap, box.x, box.y)
          }
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
  // Cache the last successfully rendered blob so download/copy reuse it instead
  // of re-rendering. Critical for copy: it keeps clipboard.write inside the
  // user-gesture activation window (an awaited render() would break it →
  // "Document is not focused" NotAllowedError).
  let lastBlob: { variant: 'portrait' | 'landscape', blob: Blob } | null = null

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
      lastBlob = { variant, blob }

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

  /** Reuse the cached blob for this variant, else render a fresh one. */
  async function ensureBlob(variant: 'portrait' | 'landscape'): Promise<Blob | null> {
    if (lastBlob && lastBlob.variant === variant)
      return lastBlob.blob
    return render(variant)
  }

  async function download(variant: 'portrait' | 'landscape' = 'portrait'): Promise<void> {
    const blob = await ensureBlob(variant)
    if (!blob)
      return

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${opts.slug.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'share'}.png`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function copyToClipboard(variant: 'portrait' | 'landscape' = 'portrait'): Promise<boolean> {
    if (!navigator.clipboard?.write) {
      error.value = '当前浏览器不支持复制图片到剪贴板'
      return false
    }
    try {
      const cached = lastBlob && lastBlob.variant === variant ? lastBlob.blob : null
      if (cached) {
        // Already rendered (preview): write synchronously within the gesture.
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': cached })])
      }
      else {
        // Not yet rendered: hand a Promise<Blob> to ClipboardItem so the async
        // render stays inside the user-activation window (avoids the
        // "Document is not focused" rejection from awaiting render() first).
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': render(variant).then((b) => {
              if (!b)
                throw new Error('render failed')
              return b
            }),
          }),
        ])
      }
      return true
    }
    catch (e) {
      error.value = (e as Error).message
      return false
    }
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
