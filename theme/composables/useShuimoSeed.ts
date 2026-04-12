import { computed, ref } from 'vue'

/**
 * 简单的字符串哈希函数
 */
function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++)
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0
  return Math.abs(hash)
}

// 每次页面加载生成一个随机种子，整个会话内保持一致
// 刷新页面 → 新种子 → 新画面
const sessionSeed = ref(Math.floor(Math.random() * 100000))

/**
 * 页面级种子：每次刷新不同
 */
export function usePageSeed() {
  return computed(() => sessionSeed.value)
}

/**
 * 组件级种子：同一页面上不同组件使用不同种子
 */
export function useComponentSeed(name: string) {
  return computed(() => sessionSeed.value ^ hashString(name))
}

/**
 * 强制刷新种子（生成全新的画面）
 */
export function refreshSeed() {
  sessionSeed.value = Math.floor(Math.random() * 100000)
}

/**
 * 获取当前季节（用于四君子装饰选择）
 */
export function getCurrentSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
  const month = new Date().getMonth() + 1
  if (month >= 3 && month <= 5)
    return 'spring'
  if (month >= 6 && month <= 8)
    return 'summer'
  if (month >= 9 && month <= 11)
    return 'autumn'
  return 'winter'
}

/**
 * 根据季节返回对应的花卉类型
 */
export function getSeasonFlora(): 'orchid' | 'bamboo' | 'chrysanthemum' | 'plum' {
  const season = getCurrentSeason()
  const floraMap = {
    spring: 'orchid' as const,
    summer: 'bamboo' as const,
    autumn: 'chrysanthemum' as const,
    winter: 'plum' as const,
  }
  return floraMap[season]
}
