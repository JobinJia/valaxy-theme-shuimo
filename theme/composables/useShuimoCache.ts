// LRU：缓存的是大尺寸 PNG dataURL/blob URL（单条可达数 MB），无上限的话
// resize 循环几次就会塞进数十 MB。Map 自带插入序，淘汰最早的项即可
const MAX_ENTRIES = 32
const cache = new Map<string, string>()

function evict(key: string) {
  const value = cache.get(key)
  if (value && value.startsWith('blob:'))
    URL.revokeObjectURL(value)
  cache.delete(key)
}

/**
 * 获取或生成缓存的 SVG/DataURL
 * 同一次页面会话内缓存，刷新后重新生成（新画面）
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
    // 淘汰最早插入的项；blob URL 顺手 revoke 释放底层 Blob 内存
    const oldest = cache.keys().next().value
    if (oldest !== undefined)
      evict(oldest)
  }
  cache.set(key, result)
  return result
}

/**
 * 清除所有缓存（含 revoke 所有 blob URL）
 */
export function clearShuimoCache() {
  for (const key of cache.keys())
    evict(key)
  cache.clear()
}
