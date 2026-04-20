<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { FALLBACK_LOCATION, moonShadowPath } from '../composables/astronomy'
import { useThemeConfig } from '../composables/config'
import { useAstronomy } from '../composables/useAstronomy'

const props = withDefaults(defineProps<{
  size?: number
}>(), { size: 70 })

const themeConfig = useThemeConfig()
const { t } = useI18n()

const astronomyConfig = computed(() => themeConfig.value?.astronomy ?? {})
const tiltByLatitude = computed(() => astronomyConfig.value.moon?.tiltByLatitude ?? true)
const allowVisitorOverride = computed(() => astronomyConfig.value.allowVisitorOverride ?? true)

const { state, setVisitorLocation, clearVisitorOverride } = useAstronomy({
  configLocation: astronomyConfig.value.location,
  allowVisitorOverride: allowVisitorOverride.value,
})

const R = computed(() => props.size / 2 - 2)
const shadowPath = computed(() => moonShadowPath(state.value.moon.phase, props.size / 2, props.size / 2, R.value))
const tiltDeg = computed(() => tiltByLatitude.value ? state.value.moon.parallacticAngleDeg : 0)

const phaseLabel = computed(() => t('shuimo.astronomy.label_phase', { name: t(`shuimo.astronomy.phase.${state.value.moon.phaseKey}`) }))
const locationLabel = computed(() => {
  const { location } = state.value
  if (location.name)
    return location.name
  const lat = `${location.lat >= 0 ? 'N' : 'S'}${Math.abs(location.lat).toFixed(2)}°`
  const lng = `${location.lng >= 0 ? 'E' : 'W'}${Math.abs(location.lng).toFixed(2)}°`
  return `${lat} ${lng}`
})

const moonStyle = computed(() => ({
  left: `${state.value.moon.x}%`,
  top: `${state.value.moon.y}%`,
  width: `${props.size}px`,
  height: `${props.size}px`,
}))

const isVisitorOverride = computed(() => {
  const cfg = astronomyConfig.value.location ?? FALLBACK_LOCATION
  return state.value.location.lat !== cfg.lat || state.value.location.lng !== cfg.lng
})

const message = ref<string | null>(null)
let messageTimer: ReturnType<typeof setTimeout> | null = null
function flashMessage(text: string, ms = 3000) {
  message.value = text
  if (messageTimer)
    clearTimeout(messageTimer)
  messageTimer = setTimeout(() => {
    message.value = null
  }, ms)
}

onUnmounted(() => {
  if (messageTimer) {
    clearTimeout(messageTimer)
    messageTimer = null
  }
})

function requestVisitorLocation() {
  if (!allowVisitorOverride.value)
    return
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    flashMessage(t('shuimo.astronomy.location_failed'))
    return
  }
  flashMessage(t('shuimo.astronomy.locating'), 60000)
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      setVisitorLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      message.value = null
    },
    () => flashMessage(t('shuimo.astronomy.location_failed')),
    { timeout: 5000 },
  )
}
</script>

<template>
  <div v-if="!state.moon.hidden" class="shuimo-moon-astro" :style="moonStyle">
    <svg
      class="shuimo-moon-astro__svg"
      :width="size"
      :height="size"
      :viewBox="`0 0 ${size} ${size}`"
      aria-hidden="true"
    >
      <defs>
        <radialGradient :id="`moon-grad-${size}`" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#f5f0e0" />
          <stop offset="50%" stop-color="#e8e0c8" />
          <stop offset="100%" stop-color="#d5c8a0" />
        </radialGradient>
        <filter :id="`moon-blur-${size}`">
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
      </defs>
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="R"
        :fill="`url(#moon-grad-${size})`"
      />
      <g :transform="`rotate(${tiltDeg} ${size / 2} ${size / 2})`" :filter="`url(#moon-blur-${size})`">
        <path :d="shadowPath" fill="rgba(20, 22, 30, 0.85)" />
      </g>
    </svg>

    <div class="shuimo-moon-astro__pill">
      <span class="shuimo-moon-astro__loc">{{ locationLabel }}</span>
      <span class="shuimo-moon-astro__sep">·</span>
      <span class="shuimo-moon-astro__phase">{{ phaseLabel }}</span>
      <span class="shuimo-moon-astro__sep">·</span>
      <span class="shuimo-moon-astro__shichen">{{ state.shichen }}时</span>
      <button
        v-if="allowVisitorOverride"
        class="shuimo-moon-astro__btn"
        type="button"
        @click="isVisitorOverride ? clearVisitorOverride() : requestVisitorLocation()"
      >
        {{ isVisitorOverride ? t('shuimo.astronomy.restore_blogger_view') : t('shuimo.astronomy.switch_to_my_location') }}
      </button>
      <span v-if="message" class="shuimo-moon-astro__msg">{{ message }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.shuimo-moon-astro {
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: auto;

  // Invisible hover bridge spanning the 8px gap between moon and pill —
  // keeps :hover active on the parent while the cursor crosses the gap,
  // so the pill's pointer-events stay enabled and the button is clickable.
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    width: 360px;
    height: 8px;
  }

  &__svg {
    display: block;
    filter: drop-shadow(0 0 18px rgba(240, 230, 200, 0.18));
  }

  &__pill {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translate(-50%, 8px);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    font-family: var(--sm-font-kai);
    font-size: 11px;
    color: var(--sm-ink-light);
    background: rgba(0, 0, 0, 0.25);
    border-radius: 999px;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.3s ease 0.15s;
    pointer-events: none;
  }

  &:hover &__pill,
  &:focus-within &__pill {
    opacity: 1;
    pointer-events: auto;
  }

  &__btn {
    background: none;
    border: 1px solid rgba(255, 255, 255, 0.25);
    color: inherit;
    border-radius: 999px;
    padding: 1px 6px;
    cursor: pointer;
    font-size: inherit;
    font-family: inherit;
  }

  &__msg {
    color: var(--sm-accent, #c8102e);
  }
}
</style>
