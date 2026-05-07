<script setup lang="ts">
import { lunar } from '@shuimo-design/lunar'
import { ref } from 'vue'
import { useInterval } from '../composables/useTimedCallback'

const now = ref(new Date())

function formatDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function getLunarDisplay(d: Date) {
  const dateStr = formatDate(d)
  const result = lunar(dateStr)
  return {
    main: `${result.year}年 ${result.month}月 ${result.day}日`,
    time: `${result.hour}时 ${result.minute}`,
    term: result.term || '',
    western: dateStr,
  }
}

const lunarInfo = ref(getLunarDisplay(now.value))

useInterval(1000, () => {
  now.value = new Date()
  lunarInfo.value = getLunarDisplay(now.value)
})
</script>

<template>
  <div class="shuimo-lunar-clock" :title="lunarInfo.western">
    <span class="shuimo-lunar-clock__date">{{ lunarInfo.main }}</span>
    <span class="shuimo-lunar-clock__time">{{ lunarInfo.time }}</span>
    <span v-if="lunarInfo.term" class="shuimo-lunar-clock__term">{{ lunarInfo.term }}</span>
    <span class="shuimo-lunar-clock__western">{{ lunarInfo.western }}</span>
  </div>
</template>

<style lang="scss" scoped>
.shuimo-lunar-clock {
  position: fixed;
  top: 14px;
  right: 56px;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--sm-ink-light);
  font-family: var(--sm-font-kai);
  letter-spacing: 1px;
  opacity: 0.6;
  transition: opacity 0.3s;
  cursor: default;
  white-space: nowrap;

  &:hover {
    opacity: 1;

    .shuimo-lunar-clock__western {
      opacity: 1;
      transform: translateY(0);
    }

    .shuimo-lunar-clock__date,
    .shuimo-lunar-clock__time,
    .shuimo-lunar-clock__term {
      opacity: 0;
    }
  }

  &__date {
    transition: opacity 0.25s;
  }

  &__time {
    transition: opacity 0.25s;
  }

  &__term {
    color: var(--sm-accent);
    font-weight: 600;
    transition: opacity 0.25s;
  }

  &__western {
    position: absolute;
    right: 0;
    font-family: var(--sm-font-mono);
    font-size: 11px;
    letter-spacing: 0;
    opacity: 0;
    transform: translateY(4px);
    transition:
      opacity 0.25s,
      transform 0.25s;
  }
}

@media (max-width: 767px) {
  .shuimo-lunar-clock {
    top: 10px;
    right: 46px;
    font-size: 10px;
    gap: 4px;
  }
}
</style>
