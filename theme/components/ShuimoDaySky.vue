<script setup lang="ts">
import { computed } from 'vue'
import { useThemeConfig } from '../composables/config'
import { useAstronomy } from '../composables/useAstronomy'

const themeConfig = useThemeConfig()
const astronomy = computed(() => themeConfig.value?.astronomy ?? {})
const layers = computed(() => astronomy.value.layers ?? {})

const { state } = useAstronomy({
  configLocation: astronomy.value.location,
  allowVisitorOverride: astronomy.value.allowVisitorOverride ?? true,
})

const sunSize = computed(() => astronomy.value.sun?.size ?? 60)

const showSun = computed(() => layers.value.sun !== false)
const showGlowMorning = computed(() => layers.value.glowMorning !== false)
const showGlowDusk = computed(() => layers.value.glowDusk !== false)
const showSkyTint = computed(() => layers.value.skyTint !== false)
// NOTE: day vignette 已移除 —— 即使 alpha=0.06 的 radial-gradient 背景，在
// hero 容器里仍会与全局 fixed 的 .shuimo-paper-bg 发生 Chrome 合成冲突，
// 导致 banner 区域纸纹"被吃掉"，对比外部纸面出现明显色差。
// dark mode 的 NightSky vignette 不受此影响（alpha 0.4 本就是夜色装饰的核心，
// 视觉上正好遮掩色差），保持不动。

// ---------- tint / glow opacity math (pure CSS-driven) ----------

/** Bell curve with peak 1 at center, 0 at center ± halfWidth. */
function bell(x: number, center: number, halfWidth: number): number {
  const d = (x - center) / halfWidth
  return Math.max(0, 1 - d * d)
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

const sunAlt = computed(() => state.value.sun.altitudeDeg)
const isRising = computed(() => state.value.sun.isRising)

/** Morning pink tint opacity (only when rising, alt 0..15°). */
const morningTintOpacity = computed(() =>
  isRising.value ? 0.05 * bell(sunAlt.value, 7.5, 7.5) : 0,
)

/** Dusk orange tint opacity (only when setting, alt -2..15°). */
const duskTintOpacity = computed(() =>
  isRising.value ? 0 : 0.06 * bell(sunAlt.value, 6.5, 8.5),
)

/** Noon warm white tint opacity (ramps up as alt passes 15°). */
const noonTintOpacity = computed(() => 0.03 * smoothstep(15, 30, sunAlt.value))

/** Morning red glow (rising, alt 0..10°). */
const morningGlowOpacity = computed(() =>
  isRising.value ? 0.25 * bell(sunAlt.value, 5, 5) : 0,
)

/** Dusk orange glow (setting, alt -5..10°). */
const duskGlowOpacity = computed(() =>
  isRising.value ? 0 : 0.3 * bell(sunAlt.value, 2.5, 7.5),
)

const sunX = computed(() => state.value.sun.x)
</script>

<template>
  <div class="shuimo-day-sky" aria-hidden="true">
    <!-- 1. sky tint (three overlays, additive) —— 挂载条件必须是"实际要显示"才挂；
         opacity:0 的空元素在 hero 容器内会创建 stacking context，与全局 fixed 的
         shuimo-paper-bg 发生合成冲突（Chrome），banner 区域纸纹会消失/变浅 -->
    <template v-if="showSkyTint">
      <div v-if="morningTintOpacity > 0" class="shuimo-day-sky__tint shuimo-day-sky__tint--morning" :style="{ opacity: morningTintOpacity }" />
      <div v-if="duskTintOpacity > 0" class="shuimo-day-sky__tint shuimo-day-sky__tint--dusk" :style="{ opacity: duskTintOpacity }" />
      <div v-if="noonTintOpacity > 0" class="shuimo-day-sky__tint shuimo-day-sky__tint--noon" :style="{ opacity: noonTintOpacity }" />
    </template>

    <!-- 2. horizon glow —— sunX 通过 CSS 变量传给渐变中心，元素自身 inset:0 全屏 -->
    <div
      v-if="showGlowMorning && morningGlowOpacity > 0"
      class="shuimo-day-sky__glow shuimo-day-sky__glow--morning"
      :style="{ 'opacity': morningGlowOpacity, '--sky-sun-x': sunX }"
    />
    <div
      v-if="showGlowDusk && duskGlowOpacity > 0"
      class="shuimo-day-sky__glow shuimo-day-sky__glow--dusk"
      :style="{ 'opacity': duskGlowOpacity, '--sky-sun-x': sunX }"
    />

    <!-- 4. sun -->
    <ShuimoSun v-if="showSun" :size="sunSize" />
  </div>
</template>

<style lang="scss" scoped>
.shuimo-day-sky {
  /* viewport 层定位：此组件在 App.vue 顶层渲染，独立于 hero 容器，
     所以晚霞 / 朝霞渐变可以用 vh/vw 单位在视口内自然淡出 */
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.shuimo-day-sky__tint {
  position: absolute;
  inset: 0;
  transition: opacity 1s ease;

  &--morning {
    background: rgba(255, 210, 210, 1);
  }
  &--dusk {
    background: rgba(255, 180, 130, 1);
  }
  &--noon {
    background: rgba(255, 250, 235, 1);
  }
}

.shuimo-day-sky__glow {
  position: absolute;
  inset: 0;
  transition: opacity 1s ease;
  /* 视口边软淡出 mask —— 与 sunX 无关、固定锚在视口中下，
     在 70%-100% 区间从黑（全显）渐变到透明（全隐），让 gradient
     不论被 viewport 切到哪都不会出现硬边。这与 background gradient
     解耦，使 gradient 本身可以放大到原版的晚霞铺满尺度 */
  mask-image: radial-gradient(50vw 45vh at 50% 50%, black 0%, black 70%, transparent 100%);
  -webkit-mask-image: radial-gradient(50vw 45vh at 50% 50%, black 0%, black 70%, transparent 100%);

  &--morning {
    background: radial-gradient(
      70vw 60vh at calc(var(--sky-sun-x, 50) * 1%) 50%,
      rgba(220, 110, 90, 1) 0%,
      rgba(220, 110, 90, 0.6) 25%,
      rgba(220, 110, 90, 0.3) 55%,
      rgba(220, 110, 90, 0.1) 80%,
      transparent 100%
    );
  }
  &--dusk {
    background: radial-gradient(
      70vw 60vh at calc(var(--sky-sun-x, 50) * 1%) 50%,
      rgba(200, 120, 70, 1) 0%,
      rgba(200, 120, 70, 0.6) 25%,
      rgba(200, 120, 70, 0.3) 55%,
      rgba(200, 120, 70, 0.1) 80%,
      transparent 100%
    );
  }
}

@media (prefers-reduced-motion: reduce) {
  .shuimo-day-sky__tint,
  .shuimo-day-sky__glow {
    transition: none;
  }
}

@media (max-width: 767px) {
  .shuimo-day-sky {
    display: none;
  }
}
</style>
