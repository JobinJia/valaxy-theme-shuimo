import { computed, ref } from 'vue'

export function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++)
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0
  return Math.abs(hash)
}

// 每次 page load 都换新 seed —— "每次打开都是新山水"是产品层面的审美选择
function loadOrInitSeed(): number {
  return Math.floor(Math.random() * 100000)
}

const sessionSeed = ref(loadOrInitSeed())

export function usePageSeed() {
  return computed(() => sessionSeed.value)
}

export function useComponentSeed(name: string) {
  // hash 提到 computed 外：name 是常量，每次 sessionSeed 变化没必要重 hash
  const nameHash = hashString(name)
  return computed(() => sessionSeed.value ^ nameHash)
}

export function refreshSeed() {
  sessionSeed.value = Math.floor(Math.random() * 100000)
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

const SEASON_FLORA = {
  spring: 'orchid',
  summer: 'bamboo',
  autumn: 'chrysanthemum',
  winter: 'plum',
} as const

export function getSeasonFlora(): 'orchid' | 'bamboo' | 'chrysanthemum' | 'plum' {
  return SEASON_FLORA[getCurrentSeason()]
}
