import { computed, ref } from 'vue'

export function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++)
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0
  return Math.abs(hash)
}

const sessionSeed = ref(Math.floor(Math.random() * 100000))

export function usePageSeed() {
  return computed(() => sessionSeed.value)
}

export function useComponentSeed(name: string) {
  return computed(() => sessionSeed.value ^ hashString(name))
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
