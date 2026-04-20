<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useComponentSeed } from '../composables/useShuimoSeed'

const seed = useComponentSeed('flying-bird')

// Seeded mulberry32 PRNG — same helper pattern as ShuimoNightSky
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

// Compute flight parameters once at setup time.
const rand = mulberry32(seed.value)
const directionLtoR = rand() < 0.5 // left→right if true
const startTopPct = 15 + rand() * 20 // 15–35 % of height
const delayMs = 10_000 + rand() * 50_000 // 10–60 s
const durationMs = 8_000 + rand() * 7_000 // 8–15 s

const phase = ref<'waiting' | 'flying' | 'done'>('waiting')

let startTimer: ReturnType<typeof setTimeout> | null = null
let endTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  startTimer = setTimeout(() => {
    phase.value = 'flying'
    endTimer = setTimeout(() => {
      phase.value = 'done'
    }, durationMs)
  }, delayMs)
})

onUnmounted(() => {
  if (startTimer)
    clearTimeout(startTimer)
  if (endTimer)
    clearTimeout(endTimer)
})

const style = computed(() => ({
  top: `${startTopPct}%`,
  animationDuration: `${durationMs}ms`,
  animationDirection: directionLtoR ? 'normal' : 'reverse',
}))
</script>

<template>
  <svg
    v-if="phase === 'flying'"
    class="shuimo-flying-bird"
    :style="style"
    viewBox="0 0 12 10"
    aria-hidden="true"
  >
    <path
      d="M0 5 Q 3 0, 6 5 M 6 5 Q 9 0, 12 5"
      stroke="rgba(40, 40, 40, 0.55)"
      stroke-width="1"
      fill="none"
      stroke-linecap="round"
    />
  </svg>
</template>

<style lang="scss" scoped>
.shuimo-flying-bird {
  position: absolute;
  left: 0;
  width: 18px;
  height: 15px;
  pointer-events: none;
  animation-name: shuimo-bird-fly;
  animation-timing-function: linear;
  animation-iteration-count: 1;
  animation-fill-mode: forwards;
}

@keyframes shuimo-bird-fly {
  from {
    transform: translateX(-10vw);
  }
  to {
    transform: translateX(110vw);
  }
}

@media (prefers-reduced-motion: reduce) {
  .shuimo-flying-bird {
    animation: none;
    display: none;
  }
}
</style>
