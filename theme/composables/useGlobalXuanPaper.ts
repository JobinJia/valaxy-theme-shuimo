import { useValaxyDark } from 'valaxy'
import { nextTick, ref, watch } from 'vue'
import { useThemeConfig } from './config'
import { generateXuanPaperTexture } from './useXuanPaperTexture'

const urlA = ref<string | null>(null)
const urlB = ref<string | null>(null)
const active = ref<'a' | 'b'>('a')

let lastW = 0
let lastH = 0
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let initialized = false

async function regenerate(isDark: boolean, themeConfig: Record<string, unknown> | undefined) {
  const w = Math.max(320, Math.ceil(window.innerWidth / 50) * 50)
  const h = Math.max(320, Math.ceil(window.innerHeight / 50) * 50)
  if (w === lastW && h === lastH && (urlA.value || urlB.value))
    return
  lastW = w
  lastH = h

  const cfg = themeConfig ?? {}
  const xuanPaper = cfg.xuanPaper as Record<string, unknown> | undefined
  if (xuanPaper?.enable === false)
    return
  try {
    const url = await generateXuanPaperTexture({
      variant: (xuanPaper?.variant as 'processed' | 'aged' | 'gold') || 'processed',
      width: w,
      height: h,
      seed: 42,
      isDark,
      goldDensity: xuanPaper?.goldDensity as number | undefined,
    })

    const next = active.value === 'a' ? 'b' : 'a'
    if (next === 'a')
      urlA.value = url
    else
      urlB.value = url
    await nextTick()
    await new Promise(r => setTimeout(r, 50))
    active.value = next
  }
  catch {}
}

function scheduleRegenerate(isDark: boolean, themeConfig: Record<string, unknown> | undefined) {
  if (debounceTimer)
    clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => regenerate(isDark, themeConfig), 100)
}

export function useGlobalXuanPaper() {
  if (typeof window === 'undefined')
    return { urlA, urlB, active }

  if (!initialized) {
    initialized = true

    const { isDark } = useValaxyDark()
    const themeConfig = useThemeConfig()

    function trigger() {
      scheduleRegenerate(isDark.value, themeConfig.value as unknown as Record<string, unknown> | undefined)
    }

    trigger()
    watch(isDark, () => {
      lastW = 0
      lastH = 0
      trigger()
    })
    window.addEventListener('resize', trigger)
  }

  return { urlA, urlB, active }
}
