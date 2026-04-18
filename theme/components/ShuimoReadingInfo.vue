<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useThemeConfig } from '../composables'

const { t } = useI18n()
const themeConfig = useThemeConfig()
const route = useRoute()
const config = computed(() => themeConfig.value?.readingInfo)
const frontmatter = computed(() => (route.meta?.frontmatter || {}) as any)

const wordCount = ref(0)
const readingTime = ref(0)
const wpm = computed(() => config.value?.wordsPerMinute ?? 300)

function countWords() {
  const article = document.querySelector('.shuimo-post-page__content')
  if (!article)
    return
  const text = article.textContent || ''
  const cjk = text.match(/[\u4E00-\u9FFF\u3400-\u4DBF]/g)
  const latin = text.match(/[a-z0-9]+/gi)
  wordCount.value = (cjk?.length || 0) + (latin?.length || 0)
  readingTime.value = Math.max(1, Math.ceil(wordCount.value / wpm.value))
}

const updatedDate = computed(() => {
  const d = frontmatter.value.updated || frontmatter.value.lastUpdated
  if (!d)
    return ''
  return new Date(d).toLocaleDateString('zh-CN')
})

const isOriginal = computed(() => frontmatter.value.original === true)

let timerId: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  timerId = setTimeout(countWords, 300)
})

onBeforeUnmount(() => {
  if (timerId)
    clearTimeout(timerId)
})
</script>

<template>
  <div v-if="config?.enable !== false" class="shuimo-reading-info">
    <span v-if="isOriginal && config?.originalMark" class="shuimo-reading-info__original">
      {{ t('shuimo.original') }}
    </span>
    <span v-if="config?.wordCount !== false && wordCount > 0" class="shuimo-reading-info__item">
      {{ t('shuimo.word_count', { count: wordCount }) }}
    </span>
    <span v-if="config?.readingTime !== false && readingTime > 0" class="shuimo-reading-info__item">
      {{ t('shuimo.reading_time', { min: readingTime }) }}
    </span>
    <span v-if="config?.updatedTime && updatedDate" class="shuimo-reading-info__item">
      {{ t('shuimo.updated_at', { date: updatedDate }) }}
    </span>
  </div>
</template>

<style lang="scss" scoped>
.shuimo-reading-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 11px;
  color: var(--sm-ink-light);
  letter-spacing: 0.5px;
  flex-wrap: wrap;
  justify-content: center;
}

.shuimo-reading-info__original {
  padding: 1px 6px;
  border: 1px solid var(--sm-accent);
  color: var(--sm-accent);
  border-radius: 2px;
  font-size: 10px;
  letter-spacing: 1px;
}

.shuimo-reading-info__item {
  &::before {
    content: '·';
    margin-right: 12px;
    color: var(--sm-ink-light);
    opacity: 0.5;
  }

  &:first-child::before {
    display: none;
  }
}

.shuimo-reading-info__original + .shuimo-reading-info__item::before {
  display: inline;
}

@media (max-width: 767px) {
  .shuimo-reading-info {
    font-size: 10px;
    gap: 8px;
  }
}
</style>
