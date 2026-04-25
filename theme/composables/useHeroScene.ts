// Pure hero-scene builder — worker-safe (no Vue / DOM deps).
// 委托给 shuimo-core 的 PaintingGenerator：画家算法 y-sort、seeded PRNG、
// distMount 远景层都由 composition 层统一负责。画面本身不再留白（条幅拉满）；
// 保留的 blankSide 仅给外层 UI（如 ShuimoVerticalNav）做左右位置提示。

import { buildWaterAndBoats, planBoats } from './useHeroScene.boats'

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
  const { Arch, Mount, PaintingGenerator, Water } = await import('@jobinjia/shuimo-core')
  // 关掉远山：shuimo-core 内部 renderPlanItem 会调 Mount.distMount；替换为空函数即可跳过
  ;(Mount as { distMount: (...args: unknown[]) => string }).distMount = () => ''
  // 注：人物由 shuimo-core 原生处理 —— Arch.arch01 内部 randChoice 0~2 个人。
  // 船由主题层自绘（见 useHeroScene.boats），保证 1~2 艘可见 + 水面涟漪，
  // 因此这里先把 Arch.boat01 替成 no-op，让 PaintingGenerator 不画船。

  const blankSide: 'left' | 'right' = seed % 2 === 0 ? 'left' : 'right'

  // shuimo-core 原生坐标系 y ∈ [-200, 800]（MountPlanner 的 y_center + Mount.mountain
  // 内部笔画向上延伸最多 ~200）。要等比缩：
  //   1. 按 display W:H 比例把 nativeW 放大 → 场景横向填满、元素保持自然形状
  //   2. viewBox 设成 "0 -200 nativeW 1000" 包含完整 native y 范围，不裁顶
  //   3. display 和 viewBox 比例相同 → preserveAspectRatio slice/meet 一样效果，纯等比缩
  const NATIVE_TOP = -200
  const NATIVE_HEIGHT = 1000 // full y range including overflow
  const nativeW = Math.round((W * NATIVE_HEIGHT) / H)

  const origBoat01 = Arch.boat01.bind(Arch)
  ;(Arch as { boat01: (...args: unknown[]) => string }).boat01 = () => ''

  let result
  try {
    result = PaintingGenerator.landscape({
      width: nativeW,
      height: NATIVE_HEIGHT,
      seed,
      onXuanPaper: false,
      // 透明输出：根 SVG 无 mix-blend-mode、fill:white 遮挡改 fill:none。
      // 条幅由主题层整页宣纸做底，无需 shuimo-core 自带 multiply；
      // 关掉后外层 <img> 也不再 multiply，彻底无色差接缝。
      transparent: true,
      // 'none' = 不做 blank-area 过滤，按正常流程把整条幅画满
      blankPosition: 'none',
      // 兜底：保证场景不空旷（boat 由主题自绘，被 no-op 掉）
      //  - arch01 = 亭子（shuimo-core 原生 randChoice 带 0~2 个人）
      //  - arch03 = 楼阁
      //  - distmount 虽然在 plan 里出现也没事（渲染时被 noop 掉）
      minCounts: { mount: 6, flatmount: 3, arch01: 2, arch03: 1 },
    })
  }
  finally {
    ;(Arch as { boat01: typeof origBoat01 }).boat01 = origBoat01
  }

  // 主题自绘水面 + 船：拼到 </svg> 前，相当于渲染在所有山 / 阁楼之上，不会被遮挡
  const plan = planBoats(nativeW, seed)
  const fragment = buildWaterAndBoats(plan, {
    boat: (x, y, s, opts) => Arch.boat01(x, y, s, opts),
    water: (x, y, s, opts) => Water.generate(x, y, s, opts),
  })

  // 后处理：
  // 1. viewBox 从 "0 0 nativeW 1000" 改为 "0 NATIVE_TOP nativeW NATIVE_HEIGHT"，
  //    让 y<0 的山顶完整出现在视口内
  // 2. 加 preserveAspectRatio=slice（aspect 匹配时 slice/meet 效果相同，写明更保险）
  // 3. 把自绘的水面 + 船拼到 </svg> 前
  //
  // 注：shuimo-core 输出里的 `fill:white`（用于山体层次遮挡）故意不替换 —— img
  // 带 mix-blend-mode:multiply，白色 multiply 下层即透明，banner 与整页纸面
  // 接缝处完全无色差。代价是后山被前山遮挡的部分可能轻微穿帮。
  const svg = result.svg
    .replace(/viewBox="0 0 [^"]+"/, `viewBox="0 ${NATIVE_TOP} ${nativeW} ${NATIVE_HEIGHT}"`)
    .replace(/^<svg /, '<svg preserveAspectRatio="xMidYMid slice" ')
    .replace(/<\/svg>\s*$/, `${fragment}</svg>`)

  return { svg, blankSide, seed }
}
