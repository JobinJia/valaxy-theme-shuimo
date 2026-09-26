// Pure hero-scene builder — worker-safe (no Vue / DOM deps).
// 委托给 shuimo-core 的 PaintingGenerator：画家算法 y-sort、seeded PRNG、
// 山水元素与船只规划都由 composition 层统一负责。画面本身不再留白（条幅拉满）；
// 保留的 blankSide 仅给外层 UI（如 ShuimoVerticalNav）做左右位置提示。

export interface HeroScene {
  svg: string
  blankSide: 'left' | 'right'
  seed: number
}

/**
 * 生成 hero 山水 SVG。H 是场景画布高度（shuimo-core 按它排布构图，
 * 默认 800）；视口适配由外层 <img object-fit:cover>
 * + SVG preserveAspectRatio=slice 兜底。
 */
export async function buildHeroScene(W: number, H: number, seed: number): Promise<HeroScene> {
  const { PaintingGenerator } = await import('@jobinjia/shuimo-core')

  const blankSide: 'left' | 'right' = seed % 2 === 0 ? 'left' : 'right'

  // shuimo-core ≥3 在有限画布模式下把整幅构图排进 y ∈ [0, H]（远山、主峰、
  // 前景坡岸、水域都按 H 等比缩放），但个别主峰笔画仍会冲出顶边（实测
  // H=800 时最多约 -110）。所以：
  //   1. 传给 core 的 height 就是真实画布高度 H，构图不会被拉伸到取景框外
  //   2. 取景框在画布上方多留 SKY_TOP = H/4 的天空，山尖不会被裁
  //   3. nativeW 按 display W:H 比例放大，viewBox 和 display 同比例 → 纯等比缩
  const SKY_TOP = Math.round(H / 4)
  const VIEW_HEIGHT = H + SKY_TOP
  const nativeW = Math.round((W * VIEW_HEIGHT) / H)

  const result = PaintingGenerator.landscape({
    width: nativeW,
    height: H,
    seed,
    onXuanPaper: false,
    // 透明输出：根 SVG 无 mix-blend-mode；山体内部遮挡仍交给 shuimo-core 处理。
    // 条幅由主题层整页宣纸做底，无需 shuimo-core 自带 multiply；
    // 关掉后外层 <img> 也不再 multiply，彻底无色差接缝。
    transparent: true,
    // 'none' = 不做 blank-area 过滤，按正常流程把整条幅画满。
    blankPosition: 'none',
    // 兜底：保证场景不空旷。theme 只通过 shuimo-core 的公开渲染开关关闭远山，
    // 不再 monkey-patch 或覆盖 core 的生成逻辑。
    minCounts: { mount: 6, flatmount: 3, arch01: 2, arch03: 1, water: 1, boat: 1 },
    renderElements: {
      distmount: false,
      water: true,
      boat: true,
    },
    placement: {
      // 水域锚定在画布中下部（H=800 时为 [700, 760]），按 H 等比，
      // 船既不会贴到底边，也不会重新漂到山体带上。
      explicitWaterBand: {
        yRange: [Math.round(H * 0.875), Math.round(H * 0.95)],
      },
    },
  })

  // 后处理：
  // 1. viewBox 从 "0 0 nativeW H" 改为 "0 -SKY_TOP nativeW VIEW_HEIGHT"，
  //    让冲出顶边的山尖完整出现在视口内
  // 2. 加 preserveAspectRatio=slice（aspect 匹配时 slice/meet 效果相同，写明更保险）
  // 注：shuimo-core 输出里的 `fill:white`（用于山体层次遮挡）故意不替换 —— img
  // 带 mix-blend-mode:multiply，白色 multiply 下层即透明，banner 与整页纸面
  // 接缝处完全无色差。代价是后山被前山遮挡的部分可能轻微穿帮。
  const svg = result.svg
    .replace(/height="\d+"/, `height="${VIEW_HEIGHT}"`)
    .replace(/viewBox="0 0 [^"]+"/, `viewBox="0 ${-SKY_TOP} ${nativeW} ${VIEW_HEIGHT}"`)
    .replace(/^<svg /, '<svg preserveAspectRatio="xMidYMid slice" ')

  return { svg, blankSide, seed }
}
