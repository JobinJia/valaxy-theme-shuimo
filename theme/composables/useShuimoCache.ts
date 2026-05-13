// LRU：缓存可复用的字符串值（SVG / dataURL）。blob URL 禁止入此 cache ——
// 它跟 consumer 的 Vue ref 共享生命周期，consumer deferred revoke 后 cache 命中
// 会返回已死 URL，引发 4 个 curtain 元素的 ERR_FILE_NOT_FOUND × 2。
const MAX_ENTRIES = 32
const cache = new Map<string, string>()

/**
 * 获取或生成缓存的字符串（SVG / dataURL）
 * 同一次页面会话内缓存，刷新后重新生成。**禁止缓存 blob URL**。
 */
export async function generateCached(
  key: string,
  generatorFn: () => Promise<string> | string,
): Promise<string> {
  const cached = cache.get(key)
  if (cached !== undefined) {
    // 命中后重新插入维持 LRU 顺序——最近访问移到尾部
    cache.delete(key)
    cache.set(key, cached)
    return cached
  }

  const result = await generatorFn()
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined)
      cache.delete(oldest)
  }
  cache.set(key, result)
  return result
}

/**
 * 清除所有缓存
 */
export function clearShuimoCache() {
  cache.clear()
}
