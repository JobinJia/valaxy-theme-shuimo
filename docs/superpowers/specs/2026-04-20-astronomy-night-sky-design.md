# 天文驱动的水墨夜空 — 设计规格

> 灵感来源：[`shuimo-design/dynamic-wallpaper`](https://github.com/shuimo-design/dynamic-wallpaper)（私有，macOS Swift 动态壁纸）。
> 该项目基于真实太阳高度角实现日夜循环。本次取其"天文驱动"思想，移植到主题的暗色 Hero 区，做成**水墨夜景**。

- **状态**：设计已与用户对齐，待 review
- **分支**：`feat/astronomy-night-sky`
- **作用范围**：仅 dark mode；仅显示 Hero 山水的页面（home / about / archives / category / tag）

---

## 0. 决策摘要

| 维度 | 决定 |
|------|------|
| 范围 | 完整夜景（月亮 + 星点 + 烟雾 + 暗角），仅 dark mode、仅 Hero 出现的页面 |
| 美学 | 水墨派 — 月亮是淡墨晕染圆盘，星点是稀疏墨点，烟雾是水墨晕染 |
| 月山交互 | 山后升月 — 月亮按真实弧线走，山水 SVG 在月亮之上自然遮挡 |
| 地平线下 | 完全隐藏（"今夜无月"也是真实） |
| 位置来源 | 博主默认坐标 + 访客可手动切换 |
| 兜底坐标 | 重庆 `{ lat: 29.56, lng: 106.55 }` |
| 视觉细节 | 月明星稀联动 ✅ ；月相随纬度倾斜 ✅ ；切换后只显示坐标（城市名留 TODO） |

---

## 1. 整体架构

夜空作为 Hero 的**子层**，不影响其它页面、不动现有山水生成逻辑。

```
ShuimoHeroLandscape  (现有，外壳不动)
└─ 暗色模式 v-if 渲染:
   ShuimoNightSky                        ← 新组件 (整夜空容器)
     ├ 1. 夜空背景层  (CSS overlay，按月相微调亮度)
     ├ 2. 暗角层      (radial gradient overlay，静态)
     ├ 3. 烟雾层      (SVG <feTurbulence>，缓慢漂移)
     ├ 4. 星点层      (SVG dots，按 seed 固定位置)
     └ 5. ShuimoMoon                     ← 新组件 (月本体 + 月相 + hover 提示)
        └ SVG mask 切出月相阴影
   现有山水 SVG  (z-index 高于上面整组 → 自然实现"山后升月")
```

**新 composables**

| 名称 | 职责 |
|------|------|
| `useAstronomy` | 包 `suncalc` 计算 + 位置状态（博主/访客）+ `localStorage` 持久化 + 全局 60s 定时刷新 |
| `useMoonPhase` | 把 `suncalc.illumination` + `@shuimo-design/lunar` 合成中文月相名 |

**新 util**：`astronomy.ts` — 把 altitude/azimuth 转屏幕 X/Y（北/南半球分别处理）

**新依赖**：`suncalc` (~7KB gzipped, MIT)。`@shuimo-design/lunar` 主题已在用。

---

## 2. 数据流

### 输入 → 计算 → 输出

```
当前时间 (Date.now())
+ 当前坐标 (lat, lng)  ──►  suncalc.getMoonPosition       ──►  { altitude, azimuth, parallacticAngle }
                       └──►  suncalc.getMoonIllumination  ──►  { fraction, phase, angle }
+ 当前农历日           ──►  @shuimo-design/lunar          ──►  { 月相中文名 }
+ 当前小时             ──►  既有 getTimeOfDay (useSolarTerm) ──►  { 时辰 (子/丑/寅...) }
                                                                          │
                                                                          ▼
                                                              useAstronomy / useMoonPhase
                                                                          │
                                                                          ▼
                          { x, y, hidden, illumFrac, phaseName, tilt, shichen, locationLabel }
                                                                          │
                                                                          ▼
                                                              ShuimoMoon / ShuimoNightSky
```

### 坐标映射

- `altitude < 0°` → `hidden = true`，月亮不渲染
- `azimuth ∈ [60°, 300°]` 线性映射到 `screenX ∈ [100%, 0%]`（北半球默认走南天弧）
  - 超出 [60°, 300°] 范围视为接近地平线，配合 altitude 已经 ≤ 0，自然 hidden
- `altitude ∈ [0°, 60°]` 二次曲线映射到 `screenY ∈ [底部地平线, 顶部 ~15%]`
- `lat < 0`（南半球观察者）镜像 X 轴

### 位置解析优先级（高 → 低）

1. URL `?loc=lat,lng` —— 分享"今晚此地的月亮"链接
2. `localStorage['shuimo:astronomy:override']` —— 访客上次的选择
3. `themeConfig.astronomy.location` —— 博主默认坐标
4. 硬编码兜底 —— `{ lat: 29.56, lng: 106.55 }`（重庆）

`themeConfig.astronomy.allowVisitorOverride === false` 时跳过 1 与 2（博主完全锁死视角）。

### 更新频率

单一 `setInterval(60_000)`，全局共享。月亮 ~0.25°/分，肉眼绝对平滑。

> **TODO**：60s 是否合适、是否做秒级肉眼可见漂移，待实现完成后实测调整。

### 月相中文名映射

`suncalc.fraction`（被照亮比例 0–1）+ `suncalc.phase`（相位角 0–1，0=朔，0.5=望）综合判定：

| phase 区间 | 中文名 |
|-----------|-------|
| ~0 | 朔 (新月) |
| 0–0.25 | 蛾眉 |
| ~0.25 | 上弦 |
| 0.25–0.5 | 渐盈凸 |
| ~0.5 | 望 (满月) |
| 0.5–0.75 | 渐亏凸 |
| ~0.75 | 下弦 |
| 0.75–1 | 残月 |

`@shuimo-design/lunar` 给的农历日（朔 = 1，望 = 15）作为交叉验证 / 兜底。

---

## 3. 视觉层堆叠（自下而上）

### 3.1 夜空背景层
- 基底沿用现有暗色 `var(--sm-paper)` 墨色
- 在其上叠一个根据**月相亮度**变化的极淡白色覆盖层
  - 满月：opacity ~0.04（夜微亮）
  - 新月：opacity 0（最深的墨夜）
  - `opacity = 0.04 * fraction`
- 整层 z-index 最底

### 3.2 暗角层（静态）
- radial-gradient overlay：`radial-gradient(ellipse at center, transparent 50%, rgba(8, 12, 24, 0.4) 100%)`
- 四角加深；不参与时间变化，只把视线收向中央

### 3.3 烟雾层
- SVG `<feTurbulence>` 生成水墨晕，mask 让其只在 Hero 下半部 1/3 出现
- CSS `transform: translateX(...)` 缓慢横向漂移，120s 一周期，无限循环
- 颜色：偏蓝灰的淡墨；opacity ~0.12（可配）
- 漂移方向由 seed 决定（向左 / 向右），同一 seed 画面一致
- `prefers-reduced-motion: reduce` → 禁用漂移，烟雾静止

### 3.4 星点层
- 默认 16 颗细笔墨点（可配，范围 12–24），按 seed 撒在 Hero 上半部
- 三种尺寸混搭：1px 微星 / 2px 普通 / 3px 主星，比例 60/30/10
- **月明星稀联动**：星点整体 opacity 与月相挂钩
  - 满月（fraction=1）→ opacity 0.2
  - 新月（fraction=0）→ opacity 0.6
  - 公式 `opacity = 0.6 - 0.4 * fraction`
- 不闪烁

### 3.5 ShuimoMoon
- 月本体：SVG `<circle>` + radial gradient
  - 边缘淡墨 → 中心更淡的米白，像宣纸上画的月
- 月相阴影：SVG mask 切出
  - 输入 `phase ∈ [0, 1)`
  - 实现：在月本体 `<circle>` 上叠一个 `<ellipse>`（terminator 椭圆），用 `<mask>` 把椭圆"扣"出阴影区域
    - `phase < 0.5`（盈月）：椭圆位于月亮右半，阴影在左
    - `phase > 0.5`（亏月）：椭圆位于左半，阴影在右
    - 椭圆 `rx = R * |cos(phase * 2π)|`（terminator 宽度随相位变化）
  - 阴影填充 `rgba(20, 22, 30, 0.85)`，应用 `feGaussianBlur stdDeviation="1.5"` 制造"墨晕"，避免硬边
- **月相倾角**：用 `suncalc.parallacticAngle` 旋转整个月相 mask（北方月 vs 南方月的"弦"角度不同）
- 大小：直径 60–80px（默认 70）
- 渲染位置：根据 `useAstronomy` 给的 `{ x, y, hidden }`，`hidden` 时直接不渲染

### 3.6 Hover 提示（沿用 LunarClock 风格）
- 鼠标悬停月亮 → 旁边淡入：
  ```
  N29.56° E106.55°  ·  月相：上弦  ·  夜半子时
  [切换到我所在地]
  ```
- 字体 / 透明度 / 过渡曲线对齐 `ShuimoLunarClock`，保持视觉一致
- 「切换到我所在地」点击触发 Geolocation 申请：
  - 成功 → 写 localStorage、更新月亮位置
  - 失败 / 拒绝 / 5s 超时 → 提示"无法获取位置，已保留博主视角"，3s 后自动消失
- 切换后展示访客的坐标；**当前阶段不展示城市名**（见 §6 TODO）
- 移动端长按月亮触发同样的提示

---

## 4. Theme Config 形状

新增到 `ThemeConfig` 顶层（`theme/types/index.d.ts`）：

```ts
/** 天文驱动的暗色夜空（仅 dark mode 生效，且仅在显示 Hero 的页面） */
astronomy: Partial<{
  /** 总开关 @default true */
  enable: boolean

  /** 博主默认坐标。未设置时兜底 = 重庆 N29.56° E106.55° */
  location: {
    lat: number     // -90 ~ 90
    lng: number     // -180 ~ 180
    /** 可选，仅用于 hover 提示展示。不填时显示原始坐标。
     *  TODO: 后续接入反向地理编码自动获取 */
    name?: string
  }

  /** 是否允许访客切换到自己的位置 @default true */
  allowVisitorOverride: boolean

  /** 各视觉层独立开关，方便博主精细调校 */
  layers: Partial<{
    moon: boolean        // @default true
    stars: boolean       // @default true
    mist: boolean        // @default true
    vignette: boolean    // @default true
  }>

  /** 月亮调节 */
  moon: Partial<{
    /** 月亮直径 px @default 70 */
    size: number
    /** 月相是否随纬度倾斜 @default true */
    tiltByLatitude: boolean
  }>

  /** 星点调节 */
  stars: Partial<{
    /** 星点数量 @default 16 */
    count: number
    /** 是否随月相联动（月明星稀） @default true */
    moonLinked: boolean
  }>

  /** 烟雾调节 */
  mist: Partial<{
    /** 烟雾透明度 @default 0.12 */
    opacity: number
    /** 漂移周期秒 @default 120 */
    driftDuration: number
  }>
}>
```

### URL & localStorage 键名

| 形式 | 用途 |
|------|------|
| `?loc=29.56,106.55` | 分享"今晚此地的月亮"链接，最高优先级 |
| `localStorage['shuimo:astronomy:override']` = `{ lat, lng }` | 访客切换后持久化；下次访问继续生效 |
| `localStorage['shuimo:astronomy:override']` = `null` | 访客主动"还原博主视角"后的状态 |

---

## 5. 边界情况 / 降级

| 场景 | 行为 |
|------|------|
| Valaxy SSG | 所有计算在 `onMounted` 内执行；首屏先渲染空夜空容器，避免 hydration 抖动 |
| `prefers-reduced-motion: reduce` | 关掉烟雾漂移动画；月亮无 hover 渐变 |
| 移动端 (≤767px) | 隐藏整个夜空层（沿用 `ShuimoDecoration` 的 mobile hide 规则），避免性能/视觉拥挤 |
| `astronomy.enable === false` | 整个 `ShuimoNightSky` 不挂载，回退到现有的静态月亮 |
| Geolocation 失败 / 拒绝 / 超时 (5s) | 月亮旁飘出"无法获取位置，已保留博主视角"，3s 自动消失 |
| `?loc` 参数格式非法 | 静默忽略，走下一级优先级 |
| 极地观察者（`abs(lat) > 66.5°`） | suncalc 自动处理；可能整夜月亮在地平线下 → 无月，符合预期 |

---

## 6. TODO（明确推迟，不在本次实现内）

- [ ] 反向地理编码：博主不填 `location.name` 时根据坐标查城市名
- [ ] 访客切换后展示城市名（同上）
- [ ] 60s 刷新频率是否合理（实测后调）
- [ ] 月亮缓慢漂移动画（要不要做、什么帧率）
- [ ] 是否扩展到 light 模式（白昼天空，参考原壁纸 morning/dusk）—— 留给后续大版本

---

## 7. 性能预算

- `suncalc` ~7KB gzipped，按需 `import('suncalc')` 异步加载
- 单一全局 `setInterval(60_000)`，多组件订阅同一个 `useAstronomy` 状态
- 烟雾用 SVG `<feTurbulence>`（GPU 友好），不是 Canvas
- 星点静态 SVG（生成一次，不重绘）
- 月相 mask 仅在月相变化时重算（一天 < 5 次）

---

## 8. 测试

- `useAstronomy.test.ts`：固定时间/位置 → 断言坐标计算、URL 解析、localStorage 覆盖优先级
- `useMoonPhase.test.ts`：满月 / 朔 / 上下弦的边界值 → 中文相位名映射
- `astronomy.test.ts`：azimuth/altitude → 屏幕坐标的关键断言（地平线、顶点、南半球镜像）
- 组件层不写单测（视觉为主），靠 demo 站手测

---

## 9. 文件清单

```
theme/
├── components/
│   ├── ShuimoHeroLandscape.vue   ← 改：dark mode v-if 渲染 ShuimoNightSky；删除现有静态月亮
│   ├── ShuimoNightSky.vue        ← 新
│   └── ShuimoMoon.vue            ← 新
├── composables/
│   ├── useAstronomy.ts           ← 新
│   ├── useAstronomy.test.ts      ← 新
│   ├── useMoonPhase.ts           ← 新
│   ├── useMoonPhase.test.ts      ← 新
│   ├── astronomy.ts              ← 新（纯函数）
│   └── astronomy.test.ts         ← 新
├── types/index.d.ts              ← 改：加 astronomy 配置类型
├── locales/zh-CN.yml + en.yml    ← 改：月相名、提示文案
└── package.json                  ← 改：+ suncalc
```

---

## 10. 显式不做（YAGNI）

- ❌ 太阳 / 白昼天空 / blue glow / orange glow（dark mode only）
- ❌ "山间间隙升月"（沿用山后升月，不动 `planScene` 与天文耦合）
- ❌ 季节差异（春夜 / 秋夜不另作区分，月相已足够丰富）
- ❌ 流星 / 北斗 / 牛郎织女等具名星象
- ❌ 反向地理编码 / 第三方 API
