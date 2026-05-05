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
 * 生成 hero 山水 SVG。H 是 SVG viewBox 高度（和 shuimo-core MountPlanner 的
 * y 坐标系对齐，原生自然值 800）；视口适配由外层 <img object-fit:cover>
 * + SVG preserveAspectRatio=slice 兜底。
 */
export async function buildHeroScene(W: number, H: number, seed: number): Promise<HeroScene> {
  const { PaintingGenerator } = await import('@jobinjia/shuimo-core')

  const blankSide: 'left' | 'right' = seed % 2 === 0 ? 'left' : 'right'

  // shuimo-core 原生坐标系 y ∈ [-200, 800]（MountPlanner 的 y_center + Mount.mountain
  // 内部笔画向上延伸最多 ~200）。要等比缩：
  //   1. 按 display W:H 比例把 nativeW 放大 → 场景横向填满、元素保持自然形状
  //   2. viewBox 设成 "0 -200 nativeW 1000" 包含完整 native y 范围，不裁顶
  //   3. display 和 viewBox 比例相同 → preserveAspectRatio slice/meet 一样效果，纯等比缩
  const NATIVE_TOP = -200
  const NATIVE_HEIGHT = 1000 // full y range including overflow
  const nativeW = Math.round((W * NATIVE_HEIGHT) / H)

  const result = PaintingGenerator.landscape({
    width: nativeW,
    height: NATIVE_HEIGHT,
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
      // Hero 视口的实际可见 y 是 [-200, 800]；把显式水域锚定在中下部，
      // 船既不会贴到底边，也不会重新漂到山体带上。
      explicitWaterBand: {
        yRange: [700, 760],
      },
    },
  })

  // 后处理：
  // 1. viewBox 从 "0 0 nativeW 1000" 改为 "0 NATIVE_TOP nativeW NATIVE_HEIGHT"，
  //    让 y<0 的山顶完整出现在视口内
  // 2. 加 preserveAspectRatio=slice（aspect 匹配时 slice/meet 效果相同，写明更保险）
  // 注：shuimo-core 输出里的 `fill:white`（用于山体层次遮挡）故意不替换 —— img
  // 带 mix-blend-mode:multiply，白色 multiply 下层即透明，banner 与整页纸面
  // 接缝处完全无色差。代价是后山被前山遮挡的部分可能轻微穿帮。
  const svg = result.svg
    .replace(/height="\d+"/, `height="${NATIVE_HEIGHT}"`)
    .replace(/viewBox="0 0 [^"]+"/, `viewBox="0 ${NATIVE_TOP} ${nativeW} ${NATIVE_HEIGHT}"`)
    .replace(/^<svg /, '<svg preserveAspectRatio="xMidYMid slice" ')

  return { svg, blankSide, seed }
}
