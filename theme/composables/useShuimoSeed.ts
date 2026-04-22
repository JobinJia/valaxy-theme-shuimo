import { computed, ref } from 'vue'

export function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++)
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0
  return Math.abs(hash)
}

// 种子在 tab 会话内保持粘性：刷新同一个 tab 保留，新 tab / 关闭重开则随机
// 粘性让 hero scene 的 sessionStorage 缓存能在刷新后命中
const SEED_STORAGE_KEY = 'shuimo-session-seed'
function loadOrInitSeed(): number {
  if (typeof window === 'undefined')
    return Math.floor(Math.random() * 100000)
  try {
    const stored = sessionStorage.getItem(SEED_STORAGE_KEY)
    if (stored) {
      const n = Number(stored)
      if (Number.isFinite(n))
        return n
    }
  }
  catch {}
  const seed = Math.floor(Math.random() * 100000)
  try {
    sessionStorage.setItem(SEED_STORAGE_KEY, String(seed))
  }
  catch {}
  return seed
}

const sessionSeed = ref(loadOrInitSeed())

export function usePageSeed() {
  return computed(() => sessionSeed.value)
}

export function useComponentSeed(name: string) {
  return computed(() => sessionSeed.value ^ hashString(name))
}

export function refreshSeed() {
  const seed = Math.floor(Math.random() * 100000)
  sessionSeed.value = seed
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(SEED_STORAGE_KEY, String(seed))
    }
    catch {}
  }
}

export function setFixedSeed(seed: number) {
  sessionSeed.value = seed
}

export function getSessionSeed(): number {
  return sessionSeed.value
}

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
