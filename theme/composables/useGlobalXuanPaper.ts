import { useValaxyDark } from 'valaxy'
import { nextTick, ref, watch } from 'vue'
import { useThemeConfig } from './config'
import { generateXuanPaperTexture } from './useXuanPaperTexture'

const urlA = ref<string | null>(null)
const urlB = ref<string | null>(null)
const active = ref<'a' | 'b'>('a')
const ready = ref(false)

let lastW = 0
let lastH = 0
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let initialized = false

function revokeTextureUrl(url: string | null) {
  if (url?.startsWith('blob:'))
    URL.revokeObjectURL(url)
}

function setTextureUrl(slot: typeof urlA, url: string) {
  if (slot.value === url)
    return
  revokeTextureUrl(slot.value)
  slot.value = url
}

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

    // 预解码 blob URL：确保图片已在浏览器内解码完成，
    // 后面 ready=true 触发幕布打开时，中央宣纸保证已真正上屏，
    // 不会出现幕布拉开 → 中央短暂空白 → 纹理才浮现的闪白
    try {
      const img = new Image()
      img.src = url
      await img.decode()
    }
    catch {}

    const next = active.value === 'a' ? 'b' : 'a'
    if (next === 'a')
      setTextureUrl(urlA, url)
    else
      setTextureUrl(urlB, url)
    await nextTick()
    active.value = next
    ready.value = true
  }
  catch {}
}

function scheduleRegenerate(isDark: boolean, themeConfig: Record<string, unknown> | undefined) {
  if (debounceTimer)
    clearTimeout(debounceTimer)
  debounceTimer = setTimeout(regenerate, 100, isDark, themeConfig)
}

export function useGlobalXuanPaper() {
  if (typeof window === 'undefined')
    return { urlA, urlB, active, ready }

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

  return { urlA, urlB, active, ready }
}
