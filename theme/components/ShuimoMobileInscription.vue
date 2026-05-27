<script setup lang="ts">
import { lunar } from '@shuimo-design/lunar'
import { computed, ref } from 'vue'
import { resolveStampSize, useThemeConfig } from '../composables'
import { useInterval } from '../composables/useTimedCallback'

const themeConfig = useThemeConfig()

const now = ref(new Date())

function formatDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

interface LunarDisplay {
  dateLine: string
  termLine: string
}

function getLunarDisplay(d: Date): LunarDisplay {
  const result = lunar(formatDate(d))
  const dateLine = `${result.year} ${result.month} ${result.day}日`
  const term = result.term || ''
  const termLine = term ? `${term} · ${result.hour}时` : `${result.hour}时`
  return { dateLine, termLine }
}

const lunarInfo = ref(getLunarDisplay(now.value))

useInterval(1000, () => {
  now.value = new Date()
  lunarInfo.value = getLunarDisplay(now.value)
})

// 印章文字
const stampText = computed(() =>
  themeConfig.value?.stamp?.author || '墨',
)
// 字体走顶层 stamp.* —— 落款印章和主印章是同一个作者身份。
const stampFontUrl = computed(() => themeConfig.value?.stamp?.fontUrl)
const stampFontFallbackUrl = computed(() => themeConfig.value?.stamp?.fontFallbackUrl)
const stampHarfbuzzWasmUrl = computed(() => themeConfig.value?.stamp?.harfbuzzSubsetWasmUrl)
// 默认 40；当用户在 stamp.size 配全局值时跟随。
const stampSize = computed(() => resolveStampSize(themeConfig.value?.stamp, 40))
</script>

<template>
  <div class="shuimo-inscription">
    <p class="shuimo-inscription__text">
      <span class="shuimo-inscription__line">{{ lunarInfo.dateLine }}</span>
      <span class="shuimo-inscription__line shuimo-inscription__line--term">
        {{ lunarInfo.termLine }}
        <span class="shuimo-inscription__stamp">
          <ShuimoStamp
            :text="stampText"
            mode="yin"
            shape="auto"
            :size="stampSize"
            :font-url="stampFontUrl"
            :font-fallback-url="stampFontFallbackUrl"
            :harfbuzz-subset-wasm-url="stampHarfbuzzWasmUrl"
          />
        </span>
      </span>
    </p>
  </div>
</template>

<style lang="scss" scoped>
.shuimo-inscription {
  position: absolute;
  bottom: 2vh;
  left: 4vw;
  z-index: 1;
  pointer-events: none;
}

.shuimo-inscription__text {
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  writing-mode: vertical-rl;
  font-family: var(--sm-font-kai);
  font-size: 13px;
  color: var(--sm-ink-light);
  letter-spacing: 0.25em;
  line-height: 1.8;
  opacity: 0.7;
}

.shuimo-inscription__line--term {
  color: var(--sm-accent);
  opacity: 0.85;
}

.shuimo-inscription__stamp {
  display: inline-block;
  margin-top: 6px;
  writing-mode: horizontal-tb;
}
</style>
