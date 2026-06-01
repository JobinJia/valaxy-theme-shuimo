import type { Box, CardSpec, ComposeDeps } from './types'

export async function composeShareCard(
  spec: CardSpec,
  ctx: CanvasRenderingContext2D,
  deps: ComposeDeps,
): Promise<void> {
  // 1. Paper base
  deps.drawXuanPaper(ctx, spec)
  ctx.fillStyle = spec.colors.paper
  ctx.globalCompositeOperation = 'destination-over'
  ctx.fillRect(0, 0, spec.width, spec.height)
  ctx.globalCompositeOperation = 'source-over'

  // 2. Scene region (ink landscape or flower, variant-dependent box)
  deps.drawScene(ctx, spec, sceneBoxFor(spec))

  // 3. Title — pass stamp box top so portrait columns stay above the seal.
  const sBox = spec.stamp?.text ? stampBoxFor(spec) : null
  drawTitle(ctx, spec, sBox?.y ?? spec.height)

  // 4. Colophon
  drawColophon(ctx, spec)

  // 5. Stamp (only when there is text) — async because the seal font loads
  if (spec.stamp?.text)
    await deps.drawStampPath(ctx, spec, stampBoxFor(spec))
}

function sceneBoxFor(spec: CardSpec): Box {
  if (spec.variant === 'portrait')
    return { x: 0, y: 0, w: spec.width, h: Math.round(spec.height * 0.55) }
  return { x: Math.round(spec.width * 0.5), y: 0, w: Math.round(spec.width * 0.5), h: spec.height }
}

function drawTitle(ctx: CanvasRenderingContext2D, spec: CardSpec, bottomLimit: number): void {
  const fontPx = spec.variant === 'portrait'
    ? Math.round(spec.width * 0.075)
    : Math.round(spec.height * 0.11)
  ctx.fillStyle = '#1a1a1a'
  // 'ShuimoCardCJK' is registered at build time by buildShareCardPlugin when
  // shareCard.titleFontPath is set. In the browser it is unknown and falls
  // through to the site's serif webfont — no visual change.
  ctx.font = `${fontPx}px 'ShuimoCardCJK', serif`
  ctx.textBaseline = 'top'

  if (spec.variant === 'portrait')
    drawVerticalTitle(ctx, spec, fontPx, bottomLimit)
  else
    drawHorizontalTitle(ctx, spec, fontPx)
}

function drawVerticalTitle(
  ctx: CanvasRenderingContext2D,
  spec: CardSpec,
  fontPx: number,
  // Title columns must not render at or below this y-coordinate.
  // When no stamp is present this equals spec.height (unconstrained).
  bottomLimit: number,
): void {
  const top = Math.round(spec.height * 0.6)
  const maxPerCol = Math.max(1, Math.floor((bottomLimit - top - fontPx) / (fontPx * 1.1)))
  const maxChars = maxPerCol * 2
  const chars = [...spec.title]
  const shown = chars.length > maxChars ? [...chars.slice(0, maxChars - 1), '…'] : chars
  const colX = spec.width - fontPx * 1.5
  let col = 0
  let row = 0
  for (const ch of shown) {
    if (row >= maxPerCol) {
      row = 0
      col++
    }
    ctx.fillText(ch, colX - col * fontPx * 1.3, top + row * fontPx * 1.1)
    row++
  }
}

function drawHorizontalTitle(ctx: CanvasRenderingContext2D, spec: CardSpec, fontPx: number): void {
  const maxW = spec.width * 0.5 - fontPx
  const x = Math.round(spec.width * 0.06)
  const y = Math.round(spec.height * 0.4)
  let text = spec.title
  if (ctx.measureText(text).width > maxW) {
    while (text.length > 1 && ctx.measureText(`${text}…`).width > maxW)
      text = text.slice(0, -1)
    text = `${text}…`
  }
  ctx.fillText(text, x, y)
}

function drawColophon(ctx: CanvasRenderingContext2D, spec: CardSpec): void {
  const fontPx = Math.round((spec.variant === 'portrait' ? spec.width : spec.height) * 0.03)
  // Same sentinel family as drawTitle — resolved by Node font registration or
  // falls through to serif in the browser.
  ctx.font = `${fontPx}px 'ShuimoCardCJK', serif`
  ctx.fillStyle = '#4a4a4a'
  ctx.textBaseline = 'alphabetic'
  const parts = [spec.author, spec.siteName, spec.dateText].filter(Boolean) as string[]
  if (parts.length === 0)
    return
  ctx.fillText(parts.join('  ·  '), Math.round(spec.width * 0.06), Math.round(spec.height * 0.93))
}

function stampBoxFor(spec: CardSpec): Box {
  const size = Math.round((spec.variant === 'portrait' ? spec.width : spec.height) * 0.14)
  return {
    x: spec.width - size - Math.round(spec.width * 0.06),
    y: spec.height - size - Math.round(spec.height * 0.06),
    w: size,
    h: size,
  }
}
