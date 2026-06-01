import type { ResolvedValaxyOptions } from 'valaxy'
import type { Plugin } from 'vite'
import type { ComposeDeps } from '../shareCard/types'
import type { ThemeConfig } from '../types'
import fs from 'node:fs'
import path from 'node:path'
import { composeShareCard } from '../shareCard/composeShareCard'
import { resolveCardSpec } from '../shareCard/resolveCardSpec'
import { slugToFileName } from '../shareCard/slugToFileName'
import { installNodeCanvasShim } from './domShim'

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
    drawMountain(ctx, spec, box) {
      const out = drawing.InkMount.generate({ width: box.w, height: box.h, seed: spec.seed })
      if (out.type === 'canvas')
        ctx.drawImage(out.canvas as unknown as CanvasImageSource, box.x, box.y)
      else
        ctx.drawImage(out.bitmap as unknown as CanvasImageSource, box.x, box.y)
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
    dateText?: string
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

      const dateText = date ? new Date(date).toLocaleDateString('zh-CN') : undefined
      entries.push({ slug, frontmatter: { title, dateText } })
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
