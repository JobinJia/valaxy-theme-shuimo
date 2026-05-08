// 共享的 stamp 字体解析 worker：让 fontkit 的 woff2 brotli 解压（trace 实测
// 主线程 36000+ samples / ~2s）从 main thread 移到 worker。所有 stamp 调用点
// （useCurtainStamp 的幕布印章 + ShuimoStamp 的主题切换印章 / 文章 frontmatter
// 印章）共用同一个 worker 实例 —— worker 内部对 (fontUrl, chars) 做缓存，二次
// 调用零成本。
//
// 用法：在 buildStampOptions 时调 `getStampFontWorker()` 拿到 Worker 引用，传
// 给 generateStampAsync 的 fontWorker 字段（shuimo-core 1.2.x+ 支持）。

let fontWorker: Worker | null = null

export function getStampFontWorker(): Worker | null {
  if (fontWorker || typeof Worker === 'undefined')
    return fontWorker
  try {
    fontWorker = new Worker(
      new URL('@jobinjia/shuimo-core/stamp/font-worker', import.meta.url),
      { type: 'module' },
    )
  }
  catch {
    fontWorker = null
  }
  return fontWorker
}

// 模块加载时（任何 stamp 相关 composable 第一次 import 即触发）立即 spawn，
// onMounted 真正调 generateStampAsync 时 worker 已 ready 等任务。
if (typeof window !== 'undefined')
  getStampFontWorker()
