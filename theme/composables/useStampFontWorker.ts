// 共享的 stamp 字体解析 worker：让 fontkit 的 woff2 brotli 解压（trace 实测
// 主线程 36000+ samples / ~2s）从 main thread 移到 worker。所有 stamp 调用点
// （useCurtainStamp 的幕布印章 + ShuimoStamp 的主题切换印章 / 文章 frontmatter
// 印章）共用同一个 worker 实例 —— worker 内部对 (fontUrl, chars) 做缓存，二次
// 调用零成本。
//
// 用法：在 buildStampOptions 时调 `getStampFontWorker()` 拿到 Worker 引用，传
// 给 generateStampAsync 的 fontWorker 字段（shuimo-core 1.2.x+ 支持）。
//
// 探活策略（必读）：dev 模式下 Vite 偶尔会让 worker 模块顶层失败 —— 比如 `import * as fontkit`
// 经 Vite optimizeDeps 处理时的某些路径异常 —— worker 构造成功但 onmessage handler 永远没挂上，
// 主线程 postMessage 进去就是黑洞，generateStampAsync 永久 await，curtainStampReady 永远 false，
// 帷幕永远不退。这就是用户看到的"偶尔卡住"。
//
// 修法：worker 创建 → 立即发一条 `{id:-1, chars:[]}` 探针。worker 健康时 0-50ms 内会回 error
// 响应（缺 fontUrl/fontData 走它自己的 catch 分支）；健康标记后 cachedWorker 暴露给同步 API。
// worker 装载失败则 error 事件命中，cachedWorker 永远是 null。worker 装载彻底卡住（极少）则
// 探针不 resolve，cachedWorker 永远是 null。
//
// 调用方拿到 null 自动走 main-thread fontkit fallback（实测 ~176ms 完成 1.2MB woff2 + glyph
// 提取），shuimo-core 1.2.x 已支持。这意味着：(a) 健康 worker 路径下首次 stamp 渲染 < 50ms
// 用 worker，(b) 探针未完成时（极短窗口）退到主线程 ~176ms，(c) worker 死透时永远主线程
// ~176ms。任何分支下印章都能渲染出来，curtain gate 不卡。
//
// 显式不引入任何 setTimeout race —— 这里不是在追"事件何时该到"，而是用 worker 自己的协议
// 探活，事件没回 = 用不了。

let cachedWorker: Worker | null = null

function startProbe(): void {
  if (typeof Worker === 'undefined')
    return

  let w: Worker
  try {
    w = new Worker(
      new URL('@jobinjia/shuimo-core/stamp/font-worker', import.meta.url),
      { type: 'module' },
    )
  }
  catch {
    return
  }

  const onErr = (): void => finish(false)
  const onMsg = (): void => finish(true)
  function finish(alive: boolean): void {
    w.removeEventListener('error', onErr)
    w.removeEventListener('message', onMsg)
    if (alive) {
      cachedWorker = w
    }
    else {
      w.terminate()
      cachedWorker = null
    }
  }
  w.addEventListener('error', onErr)
  w.addEventListener('message', onMsg)

  // 探针消息：worker 拿到 `{id:-1, chars:[]}`（无 fontUrl/fontData）会立刻打到自己的 catch
  // 分支返回 `{id:-1, error:"missing fontUrl/fontData"}`，对我们而言只要回任何包就证明
  // module-init OK + onmessage 挂上了。响应后 cachedWorker 公开给 caller。
  w.postMessage({ id: -1, chars: [] })
}

export function getStampFontWorker(): Worker | null {
  return cachedWorker
}

// 模块加载时（任何 stamp 相关 composable 第一次 import 即触发）立即 spawn + 探活，
// onMounted 真正调 generateStampAsync 时 worker 通常已就绪等任务。
if (typeof window !== 'undefined')
  startProbe()
