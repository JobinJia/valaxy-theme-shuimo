import { describe, expect, it } from 'vitest'
import { composeShareCard } from './composeShareCard'
import { resolveCardSpec } from './resolveCardSpec'

interface FillTextCall {
  text: string
  x: number
  y: number
}

interface MockCtx {
  calls: string[]
  drawnText: string[]
  fillTextCalls: FillTextCall[]
  fillRect: (x: number, y: number, w: number, h: number) => void
  fillText: (t: string, x: number, y: number) => void
  measureText: (t: string) => { width: number }
  font: string
  fillStyle: string
  textBaseline: string
  globalCompositeOperation: string
  drawImage: (...args: unknown[]) => void
}

function createMockCtx(): MockCtx {
  const ctx = {
    calls: [] as string[],
    drawnText: [] as string[],
    fillTextCalls: [] as FillTextCall[],
    font: '16px serif',
    fillStyle: '',
    textBaseline: '',
    globalCompositeOperation: '',
    fillRect(_x: number, _y: number, _w: number, _h: number) { this.calls.push('fillRect') },
    fillText(t: string, x: number, y: number) {
      this.drawnText.push(t)
      this.fillTextCalls.push({ text: t, x, y })
      this.calls.push('fillText')
    },
    measureText(t: string) { return { width: [...t].length * (Number.parseInt(this.font) || 16) } },
    drawImage() { this.calls.push('drawImage') },
  }
  return ctx as MockCtx
}

function fakeDeps() {
  const order: string[] = []
  return {
    order,
    deps: {
      // Block bodies so each returns void — drawStampPath's type is
      // `void | Promise<void>`, to which a bare `array.push()` number is not
      // assignable (the return-value-to-void rule excludes union returns).
      drawXuanPaper: () => { order.push('paper') },
      drawScene: () => { order.push('scene') },
      drawStampPath: () => { order.push('stamp') },
    },
  }
}

describe('composeShareCard', () => {
  it('draws paper base first', async () => {
    const spec = resolveCardSpec({ slug: '/posts/x', variant: 'landscape', frontmatter: { title: '寒山' }, themeConfig: {} })
    const ctx = createMockCtx()
    const { deps, order } = fakeDeps()
    await composeShareCard(spec, ctx as unknown as CanvasRenderingContext2D, deps)
    expect(order[0]).toBe('paper')
    expect(ctx.calls).toContain('fillRect') // paper base rect drawn
  })

  it('draws title and truncates over-long titles with an ellipsis (landscape)', async () => {
    const longTitle = '寒'.repeat(60)
    const spec = resolveCardSpec({ slug: '/posts/long', variant: 'landscape', frontmatter: { title: longTitle }, themeConfig: {} })
    const ctx = createMockCtx()
    const { deps } = fakeDeps()
    await composeShareCard(spec, ctx as unknown as CanvasRenderingContext2D, deps)
    const joined = ctx.drawnText.join('')
    expect(joined).toContain('…')
    expect([...joined].length).toBeLessThan(longTitle.length)
  })

  it('invokes mountain + stamp deps and draws the colophon (portrait)', async () => {
    const spec = resolveCardSpec({
      slug: '/posts/x',
      variant: 'portrait',
      frontmatter: { title: '寒山', dateText: '2026年1月2日' },
      themeConfig: { sidebar: { author: { name: '墨客' } }, stamp: { author: '受命' } },
    })
    const ctx = createMockCtx()
    const { deps, order } = fakeDeps()
    await composeShareCard(spec, ctx as unknown as CanvasRenderingContext2D, deps)
    expect(order).toContain('scene')
    expect(order).toContain('stamp')
    const joined = ctx.drawnText.join('')
    expect(joined).toContain('墨客')
    expect(joined).toContain('2026年1月2日')
  })

  it('skips stamp dep when there is no stamp text', async () => {
    const spec = resolveCardSpec({ slug: '/p', variant: 'portrait', frontmatter: { title: 'x' }, themeConfig: {} })
    const ctx = createMockCtx()
    const { deps, order } = fakeDeps()
    await composeShareCard(spec, ctx as unknown as CanvasRenderingContext2D, deps)
    expect(order).not.toContain('stamp')
  })

  // --- FIX 2: portrait title must not overlap the seal box ---

  it('portrait title glyphs stay above the stamp box top when stamp is set', async () => {
    const longTitle = '寒'.repeat(20)
    const spec = resolveCardSpec({
      slug: '/posts/portrait-stamp',
      variant: 'portrait',
      frontmatter: { title: longTitle },
      themeConfig: { stamp: { author: '受命之宝' } },
    })
    const ctx = createMockCtx()
    const { deps } = fakeDeps()
    await composeShareCard(spec, ctx as unknown as CanvasRenderingContext2D, deps)

    // Replicate stampBoxFor geometry to determine the expected boundary.
    // stampBoxFor: size = round(width * 0.14) for portrait; y = height - size - round(height * 0.06)
    const size = Math.round(spec.width * 0.14)
    const stampBoxTop = spec.height - size - Math.round(spec.height * 0.06)

    // Title glyphs are single-character fillText calls (length === 1).
    // The colophon is a multi-character joined string — exclude it by length.
    const titleGlyphs = ctx.fillTextCalls.filter(c => [...c.text].length === 1)

    // There must be at least one title glyph rendered.
    expect(titleGlyphs.length).toBeGreaterThan(0)

    // Every title glyph's y must be strictly above the stamp box top.
    for (const glyph of titleGlyphs)
      expect(glyph.y).toBeLessThan(stampBoxTop)
  })
})
