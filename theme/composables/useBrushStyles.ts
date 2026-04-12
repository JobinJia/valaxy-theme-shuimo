/**
 * 在 app mount 时生成笔触 SVG DataURL 并注入为 CSS 自定义属性
 * 用于 markdown 内容中无法使用 Vue 组件的场景（hr, h2::before 等）
 */
export async function initBrushStyles() {
  try {
    const { stroke, naturalBrushStroke } = await import('@jobinjia/shuimo-core/drawing')

    // hr 分隔线：水平笔触
    const hrSvg = naturalBrushStroke(
      [[20, 8], [280, 8]],
      {
        width: 3,
        color: 'rgba(138, 126, 112, 0.3)',
        pressure: (t: number) => Math.sin(t * Math.PI) * 0.8,
      },
    )
    const hrDataUrl = svgToDataURL(hrSvg, 300, 16)

    // h2 竖线装饰：垂直笔触
    const h2Svg = stroke(
      [[3, 2], [3, 22]],
      {
        wid: 4,
        col: 'rgba(42, 37, 32, 0.7)',
        noi: 0.2,
      },
    )
    const h2DataUrl = svgToDataURL(h2Svg, 6, 24)

    // h3 竖线装饰
    const h3Svg = stroke(
      [[2, 2], [2, 18]],
      {
        wid: 3,
        col: 'rgba(107, 94, 80, 0.6)',
        noi: 0.2,
      },
    )
    const h3DataUrl = svgToDataURL(h3Svg, 5, 20)

    // 注入 CSS 自定义属性
    const root = document.documentElement
    root.style.setProperty('--sm-brush-hr', `url("${hrDataUrl}")`)
    root.style.setProperty('--sm-brush-h2-accent', `url("${h2DataUrl}")`)
    root.style.setProperty('--sm-brush-h3-accent', `url("${h3DataUrl}")`)
  }
  catch {
    // shuimo-core 不可用，保持 CSS fallback
  }
}

function svgToDataURL(svgContent: string, width: number, height: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${svgContent}</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
