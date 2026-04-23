// Pure hero-scene builder — worker-safe (no Vue / DOM deps).
// 委托给 shuimo-core 的 PaintingGenerator：画家算法 y-sort、seeded PRNG、
// distMount 远景层都由 composition 层统一负责。画面本身不再留白（条幅拉满）；
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
  const { PaintingGenerator, Mount } = await import('@jobinjia/shuimo-core')
  // 关掉远山：shuimo-core 内部 renderPlanItem 会调 Mount.distMount；替换为空函数即可跳过
  ;(Mount as { distMount: (...args: unknown[]) => string }).distMount = () => ''
  // 注：人物由 shuimo-core 原生处理 —— Arch.arch01 内部 randChoice 0~2 个人，
  // Arch.boat01 内部默认带一个拿 rod01（钓竿）的人。主题层不再追加 Man.man，避免叠人。

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
    // 'none' = 不做 blank-area 过滤，按正常流程把整条幅画满
    blankPosition: 'none',
    // 兜底：保证场景不空旷。
    //  - arch01 = 亭子（shuimo-core 原生 randChoice 带 0~2 个人）
    //  - arch03 = 楼阁
    //  - boat   = 船（shuimo-core 原生自带一个拿 rod01 钓竿的人）
    //  - distmount 虽然在 plan 里出现也没事（渲染时被 noop 掉）
    minCounts: { mount: 6, flatmount: 3, arch01: 2, arch03: 1, boat: 1 },
  })

  // 后处理：
  // 1. viewBox 从 "0 0 nativeW 1000" 改为 "0 NATIVE_TOP nativeW NATIVE_HEIGHT"，
  //    让 y<0 的山顶完整出现在视口内
  // 2. `fill:white` → 宣纸底色 #fcfaf0，墨色 multiply 后与页面纸同色（保层次遮挡）
  // 3. 加 preserveAspectRatio=slice（aspect 匹配时 slice/meet 效果相同，写明更保险）
  const svg = result.svg
    .replace(/viewBox="0 0 [^"]+"/, `viewBox="0 ${NATIVE_TOP} ${nativeW} ${NATIVE_HEIGHT}"`)
    .replace(/^<svg /, '<svg preserveAspectRatio="xMidYMid slice" ')
    .replace(/fill\s*:\s*white/gi, 'fill:#fcfaf0')

  return { svg, blankSide, seed }
}
