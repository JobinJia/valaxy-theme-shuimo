import type { ResolvedValaxyOptions } from 'valaxy'
import type { Plugin } from 'vite'
import type { ComposeDeps } from '../shareCard/types'
import type { ThemeConfig } from '../types'
import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'
import { composeShareCard } from '../shareCard/composeShareCard'
import { resolveCardSpec } from '../shareCard/resolveCardSpec'
import { slugToFileName } from '../shareCard/slugToFileName'
import { installNodeCanvasShim } from './domShim'

/**
 * Format a raw date string to zh-CN locale. Mirrors the logic in resolveCardSpec's
 * formatDate helper so the font subset covers the exact glyphs that will render.
 */
function formatDateForSubset(date?: string): string | undefined {
  if (!date)
    return undefined
  const d = new Date(date)
  if (Number.isNaN(d.getTime()))
    return undefined
  return d.toLocaleDateString('zh-CN')
}

/**
 * Collect all characters used across card texts (titles + colophon parts) so
 * the font can be subset to the minimal glyph set before registering.
 */
function collectCardChars(posts: PostEntry[]): string {
  const chars = new Set<string>()
  for (const post of posts) {
    if (post.frontmatter.title) {
      for (const ch of post.frontmatter.title) chars.add(ch)
    }
    // Collect from the formatted date string — these are the glyphs that render.
    const formatted = formatDateForSubset(post.frontmatter.date)
    if (formatted) {
      for (const ch of formatted) chars.add(ch)
    }
  }
  // Include the colophon separator that appears between parts
  for (const ch of '  ·  ') chars.add(ch)
  return [...chars].join('')
}

/**
 * Attempt to subset the font at `titleFontPath` to `chars` and register it
 * with napi under the family name `ShuimoCardCJK`. Falls back to registering
 * the full font if subsetting throws. Any error is caught and logged so it
 * never aborts card generation.
 */
async function registerTitleFont(
  napi: typeof import('@napi-rs/canvas'),
  titleFontPath: string,
  chars: string,
): Promise<void> {
  const { subsetFontBuffer } = await import('@jobinjia/shuimo-core')
  try {
    const fontData = fs.readFileSync(titleFontPath)
    // Extract the exact slice the Buffer occupies — Buffer may reference a
    // shared pool whose .buffer starts at byteOffset, not 0.
    const fontArrayBuffer = fontData.buffer.slice(fontData.byteOffset, fontData.byteOffset + fontData.byteLength)
    let subset: ArrayBuffer
    try {
      subset = await subsetFontBuffer(fontArrayBuffer, [...chars])
      napi.GlobalFonts.register(Buffer.from(subset), 'ShuimoCardCJK')
      console.warn(`[shuimo:share-card] registered title font (${[...chars].length} glyphs subset from ${path.basename(titleFontPath)})`)
    }
    catch (subsetErr) {
      console.warn('[shuimo:share-card] font subsetting failed, registering full font:', subsetErr)
      napi.GlobalFonts.registerFromPath(titleFontPath, 'ShuimoCardCJK')
    }
  }
  catch (err) {
    console.warn('[shuimo:share-card] title font registration failed:', err)
  }
}

async function loadCanvas(): Promise<typeof import('@napi-rs/canvas') | null> {
  try {
    return await import('@napi-rs/canvas')
  }
  catch {
    return null
  }
}

let stampWarned = false

async function buildNodeDeps(napi: typeof import('@napi-rs/canvas')): Promise<ComposeDeps | null> {
  let elements: typeof import('@jobinjia/shuimo-core/elements')
  let drawing: typeof import('@jobinjia/shuimo-core/drawing')
  try {
    elements = await import('@jobinjia/shuimo-core/elements')
    drawing = await import('@jobinjia/shuimo-core/drawing')
  }
  catch {
    return null
  }
  void napi // napi already used by the shim; kept for symmetry/clarity
  return {
    drawXuanPaper(ctx, spec) {
      const paper = elements.xuanPaper({ width: spec.width, height: spec.height, seed: spec.seed, mode: 'canvas' })
      ctx.drawImage(paper as unknown as CanvasImageSource, 0, 0)
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
        ctx.drawImage(flower as unknown as CanvasImageSource, box.x, box.y)
      }
      else {
        const out = drawing.InkMount.generate({ width: box.w, height: box.h, seed: spec.seed, layers: 6, mist: { coverage: 0.6 } })
        if (out.type === 'canvas')
          ctx.drawImage(out.canvas as unknown as CanvasImageSource, box.x, box.y)
        else
          ctx.drawImage(out.bitmap as unknown as CanvasImageSource, box.x, box.y)
      }
    },
    async drawStampPath(_ctx, _spec, _box) {
      // Build-time best-effort: core's canvas stamp is browser-only and throws
      // in Node. Skip the seal on OG cards rather than fail the whole card.
      if (!stampWarned) {
        console.warn('[shuimo:share-card] seal skipped on OG cards (core canvas stamp is browser-only in Node)')
        stampWarned = true
      }
    },
  }
}

interface PostEntry {
  slug: string
  frontmatter: {
    title?: string
    /** Raw date string extracted from YAML frontmatter. Formatted by resolveCardSpec. */
    date?: string
  }
}

// Matches a YAML frontmatter field like `title: some value` (leading indent optional).
// The value capture group starts with \S (non-whitespace) to avoid quantifier
// overlap between the separator `[ \t]+` and a greedy `.+`.
const TITLE_RE = /^[ \t]*title:[ \t]+(\S.*)$/
const DATE_RE = /^[ \t]*date:[ \t]+(\S.*)$/

function collectPostEntries(userRoot: string): PostEntry[] {
  const entries: PostEntry[] = []
  const pagesDir = path.join(userRoot, 'pages')

  const walk = (dir: string): void => {
    let dirEntries
    try {
      dirEntries = fs.readdirSync(dir, { withFileTypes: true })
    }
    catch {
      return
    }
    for (const e of dirEntries) {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) {
        walk(p)
        continue
      }
      if (!e.name.endsWith('.md'))
        continue

      let content: string
      try {
        content = fs.readFileSync(p, 'utf8')
      }
      catch {
        continue
      }

      // Extract leading frontmatter block
      const fm = content.match(/^---\n([\s\S]*?)\n---/)
      let title: string | undefined
      let date: string | undefined
      if (fm) {
        for (const line of fm[1].split('\n')) {
          const titleMatch = line.match(TITLE_RE)
          if (titleMatch)
            title = titleMatch[1].trim().replace(/^['"]|['"]$/g, '')
          const dateMatch = line.match(DATE_RE)
          if (dateMatch)
            date = dateMatch[1].trim().replace(/^['"]|['"]$/g, '')
        }
      }

      // Compute slug from path relative to pages/ without .md extension
      const rel = path.relative(pagesDir, p).replace(/\.md$/, '').replace(/\\/g, '/')
      const slug = `/${rel}`

      // Pass raw date through — resolveCardSpec formats it via formatDate.
      entries.push({ slug, frontmatter: { title, date } })
    }
  }

  walk(pagesDir)
  return entries
}

export function buildShareCardPlugin(
  options: ResolvedValaxyOptions<ThemeConfig>,
): Plugin {
  return {
    name: 'valaxy-theme-shuimo:share-card',
    apply: 'build',

    async buildStart() {
      const themeConfig = (options.config.themeConfig ?? {}) as ThemeConfig

      // Respect shareCard.enable and shareCard.og flags
      if (themeConfig.shareCard?.enable === false || themeConfig.shareCard?.og === false) {
        console.warn('[shuimo:share-card] OG card generation disabled via shareCard config')
        return
      }

      const napi = await loadCanvas()
      if (!napi) {
        console.warn('[shuimo:share-card] @napi-rs/canvas not found — skipping OG card generation')
        return
      }

      // Install the DOM shim so shuimo-core canvas paths work in Node, then
      // remove it after all cards are rendered. Leaving a fake `document` on
      // globalThis beyond this point can confuse other build tools (e.g. the
      // sass dart runtime checks for DOM APIs and throws on incomplete shims).
      installNodeCanvasShim()
      const g = globalThis as Record<string, unknown>

      try {
        const deps = await buildNodeDeps(napi)
        if (!deps) {
          console.warn('[shuimo:share-card] @jobinjia/shuimo-core not found — skipping OG card generation')
          return
        }

        const { userRoot } = options
        const outDir = path.join(userRoot, 'public', 'share-cards')
        fs.mkdirSync(outDir, { recursive: true })

        const posts = collectPostEntries(userRoot)

        // Register a CJK font for card title/colophon rendering if configured.
        // Must happen before any card is rendered so ctx.font resolves correctly.
        const titleFontPath = themeConfig.shareCard?.titleFontPath
        if (titleFontPath && fs.existsSync(titleFontPath)) {
          const chars = collectCardChars(posts)
          await registerTitleFont(napi, titleFontPath, chars)
        }
        else {
          console.warn('[shuimo:share-card] no shareCard.titleFontPath set — OG card titles may show missing CJK glyphs')
        }

        let generated = 0

        for (const post of posts) {
          try {
            const spec = resolveCardSpec({
              slug: post.slug,
              variant: 'landscape',
              frontmatter: post.frontmatter,
              themeConfig,
            })

            const canvas = napi.createCanvas(spec.width, spec.height)
            const ctx = canvas.getContext('2d')

            await composeShareCard(spec, ctx as unknown as CanvasRenderingContext2D, deps)

            const outPath = path.join(outDir, `${slugToFileName(post.slug)}.png`)
            fs.writeFileSync(outPath, canvas.toBuffer('image/png'))
            generated++
          }
          catch (err) {
            console.warn(`[shuimo:share-card] failed to generate card for ${post.slug}:`, err)
          }
        }

        console.warn(`[shuimo:share-card] generated ${generated}/${posts.length} OG cards`)
      }
      finally {
        // Always clean up the DOM shim so subsequent build tools see a clean global.
        delete g.document
        delete g.OffscreenCanvas
      }
    },
  }
}
