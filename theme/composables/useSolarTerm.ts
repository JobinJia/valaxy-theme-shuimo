export interface SolarTerm {
  name: string
  nameEn: string
  index: number
}

const SOLAR_TERMS: [string, string][] = [
  ['小寒', 'Xiaohan'],
  ['大寒', 'Dahan'],
  ['立春', 'Lichun'],
  ['雨水', 'Yushui'],
  ['惊蛰', 'Jingzhe'],
  ['春分', 'Chunfen'],
  ['清明', 'Qingming'],
  ['谷雨', 'Guyu'],
  ['立夏', 'Lixia'],
  ['小满', 'Xiaoman'],
  ['芒种', 'Mangzhong'],
  ['夏至', 'Xiazhi'],
  ['小暑', 'Xiaoshu'],
  ['大暑', 'Dashu'],
  ['立秋', 'Liqiu'],
  ['处暑', 'Chushu'],
  ['白露', 'Bailu'],
  ['秋分', 'Qiufen'],
  ['寒露', 'Hanlu'],
  ['霜降', 'Shuangjang'],
  ['立冬', 'Lidong'],
  ['小雪', 'Xiaoxue'],
  ['大雪', 'Daxue'],
  ['冬至', 'Dongzhi'],
]

// 节气日期近似表（每月两个节气，日期仅存"日"）
// 实际天文节气每年偏移 ±1 天，用固定近似足够
// 顺序：[m1d1, m1d2, m2d1, m2d2, ..., m12d1, m12d2]
const TERM_DAYS = [5, 20, 4, 19, 5, 20, 4, 20, 5, 21, 5, 21, 7, 22, 7, 23, 7, 23, 8, 23, 7, 22, 7, 21] as const

// day-level 缓存：节气一天才变一次，所有订阅者每分钟 refresh 完全没必要重算
let cachedTermDayKey = -1
let cachedTerm: SolarTerm | null = null

function dayKeyOf(date: Date): number {
  return date.getFullYear() * 1000 + date.getMonth() * 40 + date.getDate()
}

export function getSolarTerm(date: Date = new Date()): SolarTerm {
  const dayKey = dayKeyOf(date)
  if (dayKey === cachedTermDayKey && cachedTerm)
    return cachedTerm

  const month = date.getMonth()
  const day = date.getDate()
  const d1 = TERM_DAYS[month * 2]
  const d2 = TERM_DAYS[month * 2 + 1]
  const termIndex = month * 2 + (day >= d2 ? 1 : day >= d1 ? 0 : -1)
  const idx = ((termIndex + 24) % 24 + 24) % 24

  cachedTermDayKey = dayKey
  cachedTerm = {
    name: SOLAR_TERMS[idx][0],
    nameEn: SOLAR_TERMS[idx][1],
    index: idx,
  }
  return cachedTerm
}

export interface TimeOfDay {
  shichen: string
  period: 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'night'
}

const SHICHEN = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

// hour-level 缓存：时辰/period 一小时才变，避免每分钟 refresh 都重算
let cachedTimeHourKey = -1
let cachedTime: TimeOfDay | null = null

export function getTimeOfDay(date: Date = new Date()): TimeOfDay {
  const hourKey = dayKeyOf(date) * 24 + date.getHours()
  if (hourKey === cachedTimeHourKey && cachedTime)
    return cachedTime

  const hour = date.getHours()
  const shichenIdx = Math.floor(((hour + 1) % 24) / 2)
  const shichen = SHICHEN[shichenIdx]

  let period: TimeOfDay['period']
  if (hour >= 5 && hour < 7)
    period = 'dawn'
  else if (hour >= 7 && hour < 11)
    period = 'morning'
  else if (hour >= 11 && hour < 13)
    period = 'noon'
  else if (hour >= 13 && hour < 17)
    period = 'afternoon'
  else if (hour >= 17 && hour < 19)
    period = 'dusk'
  else
    period = 'night'

  cachedTimeHourKey = hourKey
  cachedTime = { shichen, period }
  return cachedTime
}

export interface SolarTermStyle {
  paperTint: string
  sealText: string
}

const TERM_TINTS: Record<number, string> = {
  0: 'rgba(200, 210, 230, 0.04)', // 小寒 — 冷蓝
  1: 'rgba(190, 200, 220, 0.05)', // 大寒 — 深冷
  2: 'rgba(200, 230, 200, 0.04)', // 立春 — 嫩绿
  3: 'rgba(180, 210, 220, 0.04)', // 雨水 — 水蓝
  4: 'rgba(200, 220, 180, 0.04)', // 惊蛰 — 黄绿
  5: 'rgba(190, 230, 190, 0.05)', // 春分 — 翠绿
  6: 'rgba(180, 220, 180, 0.04)', // 清明 — 草绿
  7: 'rgba(170, 200, 170, 0.04)', // 谷雨 — 深绿
  8: 'rgba(220, 230, 180, 0.04)', // 立夏 — 黄绿
  9: 'rgba(230, 220, 170, 0.04)', // 小满 — 麦黄
  10: 'rgba(230, 210, 160, 0.04)', // 芒种 — 金黄
  11: 'rgba(240, 220, 180, 0.05)', // 夏至 — 暖黄
  12: 'rgba(240, 210, 170, 0.04)', // 小暑 — 橘黄
  13: 'rgba(240, 200, 160, 0.05)', // 大暑 — 暑热
  14: 'rgba(230, 210, 180, 0.04)', // 立秋 — 暖褐
  15: 'rgba(220, 200, 170, 0.04)', // 处暑 — 秋褐
  16: 'rgba(220, 220, 230, 0.04)', // 白露 — 露白
  17: 'rgba(210, 190, 160, 0.05)', // 秋分 — 秋金
  18: 'rgba(200, 180, 160, 0.04)', // 寒露 — 冷褐
  19: 'rgba(200, 190, 180, 0.04)', // 霜降 — 霜色
  20: 'rgba(190, 200, 210, 0.04)', // 立冬 — 冬蓝
  21: 'rgba(210, 220, 230, 0.04)', // 小雪 — 雪色
  22: 'rgba(220, 225, 235, 0.05)', // 大雪 — 深雪
  23: 'rgba(200, 210, 225, 0.05)', // 冬至 — 冬蓝
}

const PERIOD_TINTS: Record<string, string> = {
  dawn: 'rgba(255, 200, 150, 0.03)',
  morning: 'rgba(255, 245, 230, 0.02)',
  noon: 'rgba(255, 250, 240, 0.01)',
  afternoon: 'rgba(255, 230, 200, 0.02)',
  dusk: 'rgba(255, 180, 120, 0.04)',
  night: 'rgba(100, 120, 180, 0.04)',
}

export function getSolarTermStyle(date: Date = new Date()): SolarTermStyle {
  const term = getSolarTerm(date)
  const time = getTimeOfDay(date)

  const termTint = TERM_TINTS[term.index] || 'transparent'
  const timeTint = PERIOD_TINTS[time.period] || 'transparent'
  const paperTint = `linear-gradient(${termTint}, ${timeTint})`

  return {
    paperTint,
    sealText: term.name,
  }
}
