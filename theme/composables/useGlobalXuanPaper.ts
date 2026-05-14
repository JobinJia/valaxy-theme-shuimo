import type { XuanPaperOptions } from './useXuanPaperTexture'
import { useValaxyDark } from 'valaxy'
import { getCurrentInstance, nextTick, onMounted, ref, watch } from 'vue'
import { useThemeConfig } from './config'
import { timedDebounce } from './useTimedCallback'
import { buildXuanPaperLocalStorageKey, generateXuanPaperTexture } from './useXuanPaperTexture'

// "下次刷新即出真版"的指针：值是 useXuanPaperTexture 内部那条
// dataURL 的 LS key 名（~120 字节），head inline script 两层读取
// 解出 dataURL。**关键**：不复制 dataURL，避免 quota 溢出 ——
// 之前直接存 dataURL 在大尺寸 viewport 下 QuotaExceededError 被静默吞掉。
const BOOTSTRAP_POINTER_PREFIX = 'shuimo-paper-bootstrap'

function persistBootstrapPointer(options: XuanPaperOptions): void {
  if (typeof window === 'undefined')
    return
  try {
    const lsKey = buildXuanPaperLocalStorageKey(options)
    const slot = options.isDark ? 'dark' : 'light'
    localStorage.setItem(`${BOOTSTRAP_POINTER_PREFIX}-${slot}`, lsKey)
  }
  catch {
    // 即使 80 字节也写不进 = 配额满了别的东西。无 graceful fallback，下次刷新继续等 worker
  }
}

const urlA = ref<string | null>(null)
const urlB = ref<string | null>(null)
const active = ref<'a' | 'b'>('a')
const ready = ref(false)

let lastW = 0
let lastH = 0
let initialized = false
let resizeListener: (() => void) | null = null

function setTextureUrl(slot: typeof urlA, url: string) {
  if (slot.value === url)
    return
  const prev = slot.value
  slot.value = url
  // 同 App.vue::setCurtainPaperUrl：必须等 Vue 把新 url 落进 DOM + 浏览器
  // 完成一帧 paint 后再 revoke。当前两层 paper-bg 永远 display:block，浏览器
  // 不会因 URL 失效重新 fetch 所以现在踩不到；但这条安全性寄生在"层永远
  // visible"的隐式契约上，预防未来改成 v-if/display 切换时炸成 ERR_FILE_NOT_FOUND
  if (prev?.startsWith('blob:')) {
    const stale = prev
    nextTick(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          URL.revokeObjectURL(stale)
        })
      })
    })
  }
}

async function regenerate(isDark: boolean, themeConfig: Record<string, unknown> | undefined) {
  // cap 在 1920×1080：高 DPI 屏 (4K retina innerWidth 2600+) 下 raw viewport
  // 会让 PNG dataURL 超过 LS_MAX_ENTRY_SIZE(3MB) 而被静默丢弃，导致 bootstrap
  // pointer 指向不存在的 key —— 下次刷新拿不到 dataURL，"刷新即出"失效。
  // 与 App.vue ensureCurtainPaperReady 的 cap 保持一致；CSS cover 拉伸的视觉
  // 损失对噪点/纤维/金屑类纹理几乎不可见。
  const w = Math.max(320, Math.ceil(Math.min(window.innerWidth, 1920) / 50) * 50)
  const h = Math.max(320, Math.ceil(Math.min(window.innerHeight, 1080) / 50) * 50)
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
  const generateOptions: XuanPaperOptions = {
    variant: (xuanPaper?.variant as 'processed' | 'aged' | 'gold') || 'processed',
    width: w,
    height: h,
    seed: 42,
    isDark,
    goldDensity: xuanPaper?.goldDensity as number | undefined,
  }
  try {
    const url = await generateXuanPaperTexture(generateOptions)

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

    // 写下次刷新的"指向真版 dataURL 的指针"。useXuanPaperTexture 内部
    // 已经把 dataURL 写到 LS_PREFIX+cacheKey，这里只记下 key 名，零额外配额
    persistBootstrapPointer(generateOptions)
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

    // Must run after hydration — synchronous first paint flipped `active`/`urlB` mid-walk and broke SSR diff.
    function deferredInit() {
      runImmediate()
      watch(isDark, () => {
        lastW = 0
        lastH = 0
        runImmediate()
      })
      resizeListener = runDebounced
      window.addEventListener('resize', runDebounced)
    }

    if (getCurrentInstance()) {
      onMounted(async () => {
        await nextTick()
        deferredInit()
      })
    }
    else {
      Promise.resolve().then(deferredInit)
    }
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
