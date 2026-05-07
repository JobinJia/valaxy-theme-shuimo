import { useValaxyDark } from 'valaxy'
import { nextTick, ref, watch } from 'vue'
import { useThemeConfig } from './config'
import { timedDebounce } from './useTimedCallback'
import { generateXuanPaperTexture } from './useXuanPaperTexture'

const urlA = ref<string | null>(null)
const urlB = ref<string | null>(null)
const active = ref<'a' | 'b'>('a')
const ready = ref(false)

let lastW = 0
let lastH = 0
let initialized = false
let resizeListener: (() => void) | null = null

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
  if (xuanPaper?.enable === false) {
    // 关闭宣纸时下游 gate（curtain 等）仍要解锁，否则永远等不到 ready
    ready.value = true
    return
  }
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
  catch {
    // worker 抛错也必须解锁，否则下游 gate 等不到 ready 永远关着幕布
    ready.value = true
  }
}

// resize 用 trailing debounce 200ms：拖窗期间 worker 0 调用，停下后才一次到位。
// 初始化和暗色模式切换走 runImmediate，避免主题切换看到 200ms 延迟
const scheduleRegenerate = timedDebounce(regenerate, 200)

export function useGlobalXuanPaper() {
  if (typeof window === 'undefined')
    return { urlA, urlB, active, ready }

  if (!initialized) {
    initialized = true

    const { isDark } = useValaxyDark()
    const themeConfig = useThemeConfig()

    function getCfg() {
      return themeConfig.value as unknown as Record<string, unknown> | undefined
    }

    function runImmediate() {
      scheduleRegenerate.cancel()
      regenerate(isDark.value, getCfg())
    }

    function runDebounced() {
      scheduleRegenerate.schedule(isDark.value, getCfg())
    }

    runImmediate()
    watch(isDark, () => {
      lastW = 0
      lastH = 0
      runImmediate()
    })
    resizeListener = runDebounced
    window.addEventListener('resize', runDebounced)
  }

  return { urlA, urlB, active, ready }
}

// HMR：dev 下模块热替换时把旧 listener 摘掉，避免累积
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (resizeListener) {
      window.removeEventListener('resize', resizeListener)
      resizeListener = null
    }
    scheduleRegenerate.cancel()
  })
}
