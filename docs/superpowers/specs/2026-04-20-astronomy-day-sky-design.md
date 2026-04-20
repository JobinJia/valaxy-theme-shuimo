# 天文驱动的水墨白昼 — 设计规格

> 延续 `2026-04-20-astronomy-night-sky-design.md` 的"天文驱动"思路，扩展到 light mode。
> **夜空用月，白昼用日**：一淡墨晕染、一赤红圆盘；一月相、一节气；一星点烟雾、一朝霞晚霞飞鸟。

- **状态**：设计已与用户对齐，待 review
- **分支**：沿用 `feat/astronomy-night-sky`（夜空 feature 尚未合并；一同交付）
- **作用范围**：仅 light mode；仅在显示 Hero 山水的页面

---

## 0. 决策摘要

| 维度 | 决定 |
|------|------|
| 范围 | 完整日景：太阳 + 晨/昏 glow + 日间 tint + 暗角 + 飞鸟 |
| 太阳美学 | **赤日盘**：朱红实心圆盘 + 淡红外晕，无图案 |
| 天空变色 | **克制**：宣纸为底，±15° altitude 窗口内叠极淡粉 / 暖橙 / 日间微暖白（钟形曲线混合） |
| 晨霞 / 晚霞 | 只加朝霞 / 晚霞放射光；不加"蓝晕"（太科学，违和） |
| 天文机制 | 与月亮完全对称：抛物线弧、azimuth ±120°、altitude ≤ 0 隐藏、60s 刷新 |
| 弧线驱动 | Y 由 azimuth 抛物线（跟月亮同） |
| 飞鸟 | 会话内**单次**出现；两笔墨剪影；纯装饰；方向/高度/延迟由 seed 决定 |
| Hover pill | `[地点] · 节气：谷雨 · 巳时 · [切换]`（与月亮 pill 形状一致，月相↔节气对仗） |

---

## 1. 整体架构

```
ShuimoHeroLandscape  (已有，结构不动)
├─ dark mode:  <ShuimoNightSky />   (已存在，不修改)
└─ light mode: <ShuimoDaySky  />   ← 新
   (内部 5 层，自下而上)
     1. 天空 tint overlay      (CSS，按 sun altitude + azimuth 插值)
     2. 朝霞 / 晚霞              (radial gradient，仅 rising / setting 窗口)
     3. 暗角                     (复用夜空 vignette，opacity 降档)
     4. <ShuimoSun />            ← 新，赤日盘 + hover pill
     5. <ShuimoFlyingBird />     ← 新，会话内单次飞鸟
   
(既有山水 SVG 在外层，DOM 顺序保证山遮日)
```

**新组件**

| 文件 | 职责 |
|------|------|
| `theme/components/ShuimoDaySky.vue` | 容器，挂 5 层；仅 light mode 渲染 |
| `theme/components/ShuimoSun.vue` | 赤日盘 SVG + hover pill + 位置切换 |
| `theme/components/ShuimoFlyingBird.vue` | 独立飞鸟元素，seeded 随机方向/高度/延迟 |

**既有文件改动**

| 文件 | 改动 |
|------|------|
| `ShuimoHeroLandscape.vue` | 加 `<ShuimoDaySky v-if="!isDark && daySkyEnabled" />` |
| `composables/astronomy.ts` | `moonScreenPos` → **`celestialScreenPos`**；保留 `moonScreenPos` 作为 alias |
| `composables/useAstronomy.ts` | `AstronomyState` nested 化（见 §3）；`compute()` 多算 `getSunPosition` + `getSolarTerm` |
| `components/ShuimoMoon.vue` | state 访问改为 `state.value.moon.*` |
| `composables/useAstronomy.test.ts` | 断言路径跟随 state 结构 |
| `types/index.d.ts` | 加 `astronomy.sun.{...}` + 4 个 layer 开关 |
| `node/index.ts` | 默认值同步 |
| `locales/zh-CN.yml + en.yml` | 节气 pill 文案 |

**无新增依赖**：`suncalc` 已引入，`getSolarTerm` 已在 `useSolarTerm.ts`。

---

## 2. 视觉层参数

### 2.1 天空 tint（基础 overlay）

CSS overlay 贴在 DaySky 容器底层，混合三种颜色、opacity 各自由 altitude / azimuth 钟形曲线控制。三层并存而非互斥：

| 条件 | 颜色 | Opacity 公式 |
|------|------|-------------|
| 朝霞窗口 (rising, 0° ≤ alt ≤ 15°) | `rgba(255, 210, 210, 1)` 淡粉 | `0.05 * bell(alt, center=7.5, width=15)` |
| 晚霞窗口 (setting, -2° ≤ alt ≤ 15°) | `rgba(255, 180, 130, 1)` 暖橙 | `0.06 * bell(alt, center=6.5, width=17)` |
| 日间 (alt > 15°) | `rgba(255, 250, 235, 1)` 微暖白 | `0.03 * smoothstep(15°, 30°, alt)` |

`bell(x, center, width)` 是钟形曲线：在 `center` 处取值 1，在 `center ± width/2` 处取值 0。过渡平滑。

### 2.2 朝霞 / 晚霞（放射光）

SVG `<radialGradient>` 或 CSS `radial-gradient`，以太阳当前 screenX 为圆心：

| 时期 | 中心色 | 触发窗口 | 最大 opacity |
|------|--------|---------|------------|
| 朝霞 | `rgba(220, 110, 90, 1)` 朱淡红 | rising + altitude 0° → +10° | 0.25 |
| 晚霞 | `rgba(200, 120, 70, 1)` 暖橙 | setting + altitude +10° → -5° | 0.30 |

定位：`position: absolute; bottom: 0; left: calc(${sun.x}% - 40%); width: 80%; height: 60%`。Opacity 按 altitude 钟形衰减。

### 2.3 暗角

完全复用 `ShuimoNightSky.__vignette` 样式，opacity 降到 `0.15`（日间不抢戏）。

### 2.4 ShuimoSun

```svg
<svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
  <defs>
    <radialGradient :id="gradId" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#D9362E" />  <!-- 内心朱红 -->
      <stop offset="70%"  stop-color="#B02820" />  <!-- 边缘深红 -->
      <stop offset="100%" stop-color="transparent" />
    </radialGradient>
    <radialGradient :id="haloId" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="rgba(217, 54, 46, 0.35)" />
      <stop offset="100%" stop-color="transparent" />
    </radialGradient>
  </defs>
  <circle :cx="size/2" :cy="size/2" :r="size*0.75" :fill="`url(#${haloId})`" />  <!-- 外晕 -->
  <circle :cx="size/2" :cy="size/2" :r="size/2 - 2" :fill="`url(#${gradId})`" /> <!-- 本体 -->
</svg>
```

- 位置：`celestialScreenPos(sun.altitude, sun.azimuth, lat)`（与月亮同）
- Hover pill 结构与 `ShuimoMoon` 完全一致；只是内容文案从 "月相：xxx" 换成 "节气：xxx"
- Pill CSS 抽到共享 class `.shuimo-celestial-pill`（两组件引用），避免重复样式

### 2.5 ShuimoFlyingBird

**出现规则**

- 整个会话**单次**
- DaySky mount 时计算参数，`setTimeout` 到点触发；飞完 v-if false

**Seeded 随机参数**（`useComponentSeed('flying-bird')` 驱动，保证同 seed 画面一致）

| 参数 | 范围 |
|------|------|
| 方向 | `left→right` / `right→left` (50/50) |
| 起始高度 y | 15%–35%（天空中段，避开山脊） |
| 开始延迟 | 10–60s 内随机一个时刻 |
| 飞行时长 | 8–15s |
| 尺寸 | 15–20px 宽 |

**SVG**（两笔贝塞尔形成"一"字双翅）

```svg
<svg viewBox="0 0 12 10">
  <path d="M0 5 Q 3 0, 6 5 M 6 5 Q 9 0, 12 5"
        stroke="rgba(40, 40, 40, 0.55)"
        stroke-width="1" fill="none" stroke-linecap="round" />
</svg>
```

**动画**：CSS keyframes，`translateX(-10%)` → `translateX(110%)`（反向方向反转）；`linear` 无 easing。

---

## 3. Composable / Util 改动

### `astronomy.ts`

```ts
// 改名体现"日月通用"
export function celestialScreenPos(altitudeRad, azimuthRad, lat): ScreenPos
// 兼容 alias，不破坏既有外部引用
export const moonScreenPos = celestialScreenPos
```

其余纯函数（`moonShadowPath`, `resolveLocation`, `parseLocationFromUrl` 等）不变。

### `useAstronomy.ts` — state nested 化（breaking change，内部）

```ts
export interface AstronomyState {
  location: Location
  updatedAt: number
  shichen: string              // 共享
  solarTermName: string        // 新增，来自既有 getSolarTerm()
  moon: {
    hidden: boolean
    x: number
    y: number
    illumination: number
    phase: number
    phaseKey: MoonPhaseKey
    parallacticAngleDeg: number
  }
  sun: {
    hidden: boolean
    x: number
    y: number
    altitudeDeg: number       // 暴露供 DaySky 做 tint / glow 插值
    azimuthDeg: number
    isRising: boolean         // azimuthRad < 0（suncalc 约定：负数在东侧）
  }
}
```

`compute()` 内额外调用 `suncalc.getSunPosition(now, lat, lng)` 和 `getSolarTerm(now)`；CPU 成本微乎其微。

**影响的文件**

- `ShuimoMoon.vue`：所有 `state.value.xxx` → `state.value.moon.xxx`；`state.value.shichen` 和 `state.value.location` 保持顶层
- `useAstronomy.test.ts`：5 个测试的断言路径更新

---

## 4. Theme Config 扩展

### `types/index.d.ts`

```ts
astronomy?: Partial<{
  // ...既有 enable / location / allowVisitorOverride 保留...

  layers: Partial<{
    // 既有
    moon: boolean
    stars: boolean
    mist: boolean
    vignette: boolean
    // 新增
    sun: boolean           // @default true
    glowMorning: boolean   // 朝霞 @default true
    glowDusk: boolean      // 晚霞 @default true
    bird: boolean          // @default true
    skyTint: boolean       // 日间基础 tint @default true
  }>

  // ...既有 moon: { size, tiltByLatitude } 保留...

  /** 太阳调节 */
  sun: Partial<{
    /** 直径 px @default 60 */
    size: number
    /** 朱红色 @default '#D9362E' */
    color: string
  }>
}>
```

### `node/index.ts` 默认值

```ts
astronomy: {
  // ...既有字段保留...
  layers: {
    moon: true, stars: true, mist: true, vignette: true,
    sun: true, glowMorning: true, glowDusk: true, bird: true, skyTint: true,
  },
  // ...既有 moon: { size, tiltByLatitude } 保留...
  sun: { size: 60, color: '#D9362E' },
},
```

### i18n 新增

两边 locale 各加一行：

```yaml
# zh-CN.yml
shuimo:
  astronomy:
    label_solar_term: '节气：{name}'

# en.yml
shuimo:
  astronomy:
    label_solar_term: 'Solar term: {name}'
```

其它字段（phase.* / label_phase / switch_to_my_location / restore_blogger_view / location_failed / locating）复用。

---

## 5. 边界情况 / 降级

| 场景 | 行为 |
|------|------|
| 太阳 altitude ≤ 0 | 日、朝霞、晚霞全部 hidden；tint 几乎透明（钟形曲线自然衰减） |
| `astronomy.enable === false` | DaySky / NightSky 都不挂载 |
| `layers.sun === false` | 只显示氛围层（glow / tint / bird），不显示太阳本体 |
| 移动端 ≤767px | `.shuimo-day-sky { display: none }`（同 NightSky） |
| `prefers-reduced-motion: reduce` | 飞鸟动画禁用（隐藏或保持静止于起点外） |
| Light mode 但时间在夜（时区偏差） | 太阳 altitude < 0 → 全 hidden → 页面回归原 Hero light mode |
| 访客切到自己位置 | 日月同步刷新（共享 `useAstronomy` state） |

---

## 6. 测试

- `celestialScreenPos` —— 复用既有 8 个 `moonScreenPos` 测试（仅改导入名；alias 确保现存导入也能编译）
- `useAstronomy.test.ts` —— 5 个测试的断言路径跟随 state 新结构更新
- 无新 pure 测试；视觉层 / 飞鸟 / hover UX 靠手测

---

## 7. 文件清单（实现期会动到的）

```
theme/
├── components/
│   ├── ShuimoHeroLandscape.vue   ← 改：dark mode v-if ShuimoNightSky；light mode v-if ShuimoDaySky
│   ├── ShuimoMoon.vue            ← 改：state.value.moon.* 路径；抽 pill class 到共享
│   ├── ShuimoDaySky.vue          ← 新
│   ├── ShuimoSun.vue             ← 新
│   └── ShuimoFlyingBird.vue      ← 新
├── composables/
│   ├── astronomy.ts              ← 改：celestialScreenPos + moonScreenPos alias
│   ├── useAstronomy.ts           ← 改：state nested + compute() 多算 sun + solarTerm
│   └── useAstronomy.test.ts      ← 改：断言路径更新
├── types/index.d.ts              ← 改：加 sun + 新 layer 开关
├── node/index.ts                 ← 改：默认值
└── locales/zh-CN.yml + en.yml    ← 改：label_solar_term
```

---

## 8. 显式不做（YAGNI）

- ❌ 太阳相位（朔望类）—— 太阳没有相位概念
- ❌ 鸟的高级形态（扇翅、群飞、可交互弹诗句）
- ❌ 云 / 雨 / 雪 / 彩虹 / 雾 / 霾
- ❌ 白昼和黑夜的**自动切换**（继续遵从用户 / 系统 light/dark 选择）
- ❌ 反向地理编码（沿用夜空规格的 TODO；日月共用）
