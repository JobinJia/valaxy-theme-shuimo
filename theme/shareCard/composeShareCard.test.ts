import { describe, expect, it } from 'vitest'
import { composeShareCard } from './composeShareCard'
import { resolveCardSpec } from './resolveCardSpec'

interface MockCtx {
  calls: string[]
  drawnText: string[]
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
    font: '16px serif',
    fillStyle: '',
    textBaseline: '',
    globalCompositeOperation: '',
    fillRect(_x: number, _y: number, _w: number, _h: number) { this.calls.push('fillRect') },
    fillText(t: string, _x: number, _y: number) {
      this.drawnText.push(t)
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
      drawXuanPaper: () => order.push('paper'),
      drawMountain: () => order.push('mountain'),
      drawStampPath: () => order.push('stamp'),
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
    expect(order).toContain('mountain')
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
})
