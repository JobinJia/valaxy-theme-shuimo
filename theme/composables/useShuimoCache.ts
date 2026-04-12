const cache = new Map<string, string>()

/**
 * 获取或生成缓存的 SVG/DataURL
 * 同一次页面会话内缓存，刷新后重新生成（新画面）
 */
export async function generateCached(
  key: string,
  generatorFn: () => Promise<string> | string,
): Promise<string> {
  const cached = cache.get(key)
  if (cached)
    return cached

  const result = await generatorFn()
  cache.set(key, result)
  return result
}

/**
 * 清除所有缓存
 */
export function clearShuimoCache() {
  cache.clear()
}
