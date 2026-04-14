<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  date?: string | Date
  format?: 'chinese' | 'standard'
}>()

const TG = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const DZ = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const MONTHS = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']
const DAYS_1 = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

function toChineseDate(d: Date) {
  const year = d.getFullYear()
  // 天干地支年份（简化算法）
  const tgIdx = (year - 4) % 10
  const dzIdx = (year - 4) % 12
  const ganZhi = `${TG[tgIdx]}${DZ[dzIdx]}`

  const month = MONTHS[d.getMonth()]
  const day = d.getDate()

  let dayStr: string
  if (day <= 10) {
    dayStr = `初${DAYS_1[day]}`
  }
  else if (day < 20) {
    dayStr = `十${DAYS_1[day - 10]}`
  }
  else if (day === 20) {
    dayStr = '二十'
  }
  else if (day < 30) {
    dayStr = `廿${DAYS_1[day - 20]}`
  }
  else {
    dayStr = `三十${day === 30 ? '' : DAYS_1[day - 30]}`
  }

  return `${ganZhi}年${month}月${dayStr}`
}

const dateObj = computed(() => {
  if (!props.date)
    return null
  return typeof props.date === 'string' ? new Date(props.date) : props.date
})

const chineseDate = computed(() => {
  if (!dateObj.value)
    return ''
  return toChineseDate(dateObj.value)
})

const standardDate = computed(() => {
  if (!dateObj.value)
    return ''
  return dateObj.value.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

const displayFormat = computed(() => props.format || 'chinese')
</script>

<template>
  <time
    v-if="dateObj"
    class="shuimo-date"
    :datetime="dateObj.toISOString()"
    :title="standardDate"
  >
    {{ displayFormat === 'chinese' ? chineseDate : standardDate }}
  </time>
</template>

<style lang="scss" scoped>
.shuimo-date {
  font-size: 12px;
  color: var(--sm-ink-light);
  letter-spacing: 1px;
}
</style>
