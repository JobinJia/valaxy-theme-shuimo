<script setup lang="ts">
import { computed } from 'vue'
import { useThemeConfig } from '../composables/config'
import { useAstronomy } from '../composables/useAstronomy'
import { useComponentSeed } from '../composables/useShuimoSeed'

const themeConfig = useThemeConfig()
const seed = useComponentSeed('night-sky')
const astronomy = computed(() => themeConfig.value?.astronomy ?? {})
const layers = computed(() => astronomy.value.layers ?? {})

const { state } = useAstronomy({
  configLocation: astronomy.value.location,
  allowVisitorOverride: astronomy.value.allowVisitorOverride ?? true,
})

const moonSize = computed(() => astronomy.value.moon?.size ?? 70)
const starsCount = computed(() => astronomy.value.stars?.count ?? 16)
const starsLinked = computed(() => astronomy.value.stars?.moonLinked ?? true)
const mistOpacity = computed(() => astronomy.value.mist?.opacity ?? 0.12)
const mistDuration = computed(() => astronomy.value.mist?.driftDuration ?? 120)

const showMoon = computed(() => layers.value.moon !== false)
const showStars = computed(() => layers.value.stars !== false)
const showMist = computed(() => layers.value.mist !== false)
const showVignette = computed(() => layers.value.vignette !== false)

/* Background tint: full-moon nights microscopically lighter. */
const bgOverlayOpacity = computed(() => 0.04 * state.value.moon.illumination)

/* Stars: deterministic positions from seed; opacity = 0.6 - 0.4·illumination. */
function mulberry32(s: number) {
  let a = s
  return () => {
    a |= 0
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Star { cx: number, cy: number, r: number }

const stars = computed<Star[]>(() => {
  const rand = mulberry32(seed.value)
  const out: Star[] = []
  for (let i = 0; i < starsCount.value; i++) {
    const roll = rand()
    const r = roll < 0.6 ? 1 : roll < 0.9 ? 2 : 3
    out.push({
      cx: rand() * 100, // %
      cy: rand() * 55, // % (top 55% of sky band)
      r,
    })
  }
  return out
})

const starsOpacity = computed(() => starsLinked.value ? 0.6 - 0.4 * state.value.moon.illumination : 0.5)

/* Mist drift direction from seed — left or right */
const mistDir = computed(() => seed.value % 2 === 0 ? 1 : -1)
const mistAnimStyle = computed(() => ({
  animationDuration: `${mistDuration.value}s`,
  animationDirection: mistDir.value === 1 ? 'normal' : 'reverse',
  opacity: mistOpacity.value,
}))
</script>

<template>
  <div class="shuimo-night-sky" aria-hidden="true">
    <!-- 1. background tint -->
    <div class="shuimo-night-sky__bg" :style="{ opacity: bgOverlayOpacity }" />

    <!-- 2. vignette -->
    <div v-if="showVignette" class="shuimo-night-sky__vignette" />

    <!-- 3. mist -->
    <div v-if="showMist" class="shuimo-night-sky__mist" :style="mistAnimStyle">
      <svg width="100%" height="100%" preserveAspectRatio="none">
        <defs>
          <filter id="shuimo-mist-turb">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.024" numOctaves="2" seed="3" />
            <feColorMatrix
              values="0 0 0 0 0.55
                      0 0 0 0 0.6
                      0 0 0 0 0.7
                      0 0 0 0.5 0"
            />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#shuimo-mist-turb)" />
      </svg>
    </div>

    <!-- 4. stars -->
    <svg v-if="showStars" class="shuimo-night-sky__stars" :style="{ opacity: starsOpacity }" preserveAspectRatio="none" viewBox="0 0 100 100">
      <circle
        v-for="(s, i) in stars"
        :key="i"
        :cx="s.cx"
        :cy="s.cy"
        :r="s.r * 0.15"
        fill="rgba(240, 235, 215, 0.9)"
      />
    </svg>

    <!-- 5. moon -->
    <ShuimoMoon v-if="showMoon" :size="moonSize" />
  </div>
</template>

<style lang="scss" scoped>
.shuimo-night-sky {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0; // mountains in parent should be z-index ≥ 1
}

.shuimo-night-sky__bg {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 1);
  transition: opacity 1s ease;
}

.shuimo-night-sky__vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 50%, rgba(8, 12, 24, 0.4) 100%);
  pointer-events: none;
}

.shuimo-night-sky__mist {
  position: absolute;
  left: -10%;
  right: -10%;
  bottom: 0;
  height: 33%;
  pointer-events: none;
  mask-image: linear-gradient(to top, black 60%, transparent);
  -webkit-mask-image: linear-gradient(to top, black 60%, transparent);
  animation-name: shuimo-mist-drift;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}

@keyframes shuimo-mist-drift {
  from {
    transform: translateX(-3%);
  }
  to {
    transform: translateX(3%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .shuimo-night-sky__mist {
    animation: none;
  }
  .shuimo-night-sky__bg,
  .shuimo-night-sky__stars {
    transition: none;
  }
}

.shuimo-night-sky__stars {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  transition: opacity 1s ease;
}

@media (max-width: 767px) {
  .shuimo-night-sky {
    display: none;
  }
}
</style>
