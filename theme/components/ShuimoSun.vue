<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { FALLBACK_LOCATION } from '../composables/astronomy'
import { useThemeConfig } from '../composables/config'
import { useAstronomy } from '../composables/useAstronomy'

const props = withDefaults(defineProps<{
  size?: number
}>(), { size: 60 })

const themeConfig = useThemeConfig()
const { t } = useI18n()

const astronomyConfig = computed(() => themeConfig.value?.astronomy ?? {})
const sunColor = computed(() => astronomyConfig.value.sun?.color ?? '#D9362E')
const allowVisitorOverride = computed(() => astronomyConfig.value.allowVisitorOverride ?? true)

const { state, setVisitorLocation, clearVisitorOverride } = useAstronomy({
  configLocation: astronomyConfig.value.location,
  allowVisitorOverride: allowVisitorOverride.value,
})

const R = computed(() => props.size / 2 - 2)

const solarTermLabel = computed(() => t('shuimo.astronomy.label_solar_term', { name: state.value.solarTermName }))

const locationLabel = computed(() => {
  const { location } = state.value
  if (location.name)
    return location.name
  const lat = `${location.lat >= 0 ? 'N' : 'S'}${Math.abs(location.lat).toFixed(2)}°`
  const lng = `${location.lng >= 0 ? 'E' : 'W'}${Math.abs(location.lng).toFixed(2)}°`
  return `${lat} ${lng}`
})

// Halo intensity: bell curve peaking at 5° altitude, zero at -5° and 15°.
// Sun visually low (sunrise / sunset) → halo present, pairs with dawn/dusk
// sky glow. Sun high (noon) → halo fades to 0; clean disk, no false 霞光.
const haloIntensity = computed(() => {
  const d = (state.value.sun.altitudeDeg - 5) / 10
  return Math.max(0, 1 - d * d)
})

const sunGlowAlphaHex = computed(() => {
  const a = Math.round(0x40 * haloIntensity.value)
  return a.toString(16).padStart(2, '0')
})

const sunStyle = computed(() => ({
  'left': `${state.value.sun.x}%`,
  'top': `${state.value.sun.y}%`,
  'width': `${props.size}px`,
  'height': `${props.size}px`,
  // Hex + dynamic alpha suffix; 0x40 ≈ 25% at peak, 0x00 at noon
  '--sun-glow-color': `${sunColor.value}${sunGlowAlphaHex.value}`,
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

function handleToggle() {
  if (isVisitorOverride.value)
    clearVisitorOverride()
  else
    requestVisitorLocation()
}

const gradId = computed(() => `sun-grad-${props.size}`)
const haloId = computed(() => `sun-halo-${props.size}`)
</script>

<template>
  <div v-if="!state.sun.hidden" class="shuimo-sun-astro" :style="sunStyle">
    <svg
      class="shuimo-sun-astro__svg"
      :width="size"
      :height="size"
      :viewBox="`0 0 ${size} ${size}`"
      overflow="visible"
      aria-hidden="true"
    >
      <defs>
        <radialGradient :id="gradId" cx="50%" cy="50%" r="50%">
          <stop offset="0%" :stop-color="sunColor" />
          <stop offset="70%" :stop-color="sunColor" stop-opacity="0.9" />
          <stop offset="100%" :stop-color="sunColor" stop-opacity="0" />
        </radialGradient>
        <radialGradient :id="haloId" cx="50%" cy="50%" r="50%">
          <stop offset="0%" :stop-color="sunColor" :stop-opacity="0.35 * haloIntensity" />
          <stop offset="100%" :stop-color="sunColor" stop-opacity="0" />
        </radialGradient>
      </defs>
      <circle :cx="size / 2" :cy="size / 2" :r="size * 0.75" :fill="`url(#${haloId})`" />
      <circle :cx="size / 2" :cy="size / 2" :r="R" :fill="`url(#${gradId})`" />
    </svg>

    <ShuimoCelestialPill
      :location-label="locationLabel"
      :dynamic-label="solarTermLabel"
      :shichen="state.shichen"
      :show-toggle="allowVisitorOverride"
      :is-visitor-override="isVisitorOverride"
      :message="message"
      @toggle="handleToggle"
    />
  </div>
</template>

<style lang="scss" scoped>
.shuimo-sun-astro {
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: auto;

  // Invisible hover bridge so the cursor stays inside :hover when crossing
  // the 8px gap to the pill — same pattern as ShuimoMoon.
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
    filter: drop-shadow(0 0 20px var(--sun-glow-color, rgba(217, 54, 46, 0.25)));
  }

  &:hover :deep(.shuimo-celestial-pill),
  &:focus-within :deep(.shuimo-celestial-pill) {
    opacity: 1;
    pointer-events: auto;
  }
}
</style>
