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

    // 异步预解码（不阻塞 ready）：原本 await img.decode() 在 prod 下对大 blob URL
    // 永久 pending，加了 1s 超时兜底，但每次都吃满 1s（=1s 固定浪费）。改为
    // 后台跑 —— ready 立即触发让幕布尽早开启，img 解码并行进行；最坏情况是幕布
    // 拉开瞬间背景图正在 decode，中央有几十毫秒闪白，比每次多等 1s 划算。
    const img = new Image()
    img.src = url
    img.decode().catch(() => {})

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
