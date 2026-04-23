<script setup lang="ts">
/**
 * ShuimoReadingInfo — Displays article reading metadata.
 *
 * Shows word count, estimated reading time, optional update date,
 * and optional "original" badge. Placed below the article title.
 *
 * Word counting is CJK-aware: Chinese characters are counted individually,
 * while Latin words are counted by whitespace boundaries.
 *
 * Configurable via `themeConfig.readingInfo.*` options.
 */
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useArticleContentObserver, useThemeConfig } from '../composables'

const { t, locale } = useI18n()
const themeConfig = useThemeConfig()
const route = useRoute() as ReturnType<typeof useRoute> | undefined
const config = computed(() => themeConfig.value?.readingInfo)
const frontmatter = computed(() => (route?.meta?.frontmatter || {}) as any)

const wordCount = ref(0)
const readingTime = ref(frontmatter.value.readingTime ?? 0)
const wpm = computed(() => config.value?.wordsPerMinute ?? 300)
const articleRef = ref<HTMLElement | null>(null)

/**
 * Count words in the article content element.
 * CJK characters are counted individually; Latin words by regex match.
 */
function countWords() {
  const article = articleRef.value
  if (!article)
    return
  const text = article.textContent || ''
  const cjk = text.match(/[\u4E00-\u9FFF\u3400-\u4DBF]/g)
  const latin = text.match(/[a-z0-9]+/gi)
  wordCount.value = (cjk?.length || 0) + (latin?.length || 0)
  if (frontmatter.value.readingTime == null)
    readingTime.value = Math.max(1, Math.ceil(wordCount.value / wpm.value))
}

/** Format the updated date from frontmatter (supports `updated` or `lastUpdated`). */
const updatedDate = computed(() => {
  const d = frontmatter.value.updated || frontmatter.value.lastUpdated
  if (!d)
    return ''
  return new Intl.DateTimeFormat(locale.value, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(d))
})

const isOriginal = computed(() => frontmatter.value.original === true)

watch(frontmatter, () => {
  readingTime.value = frontmatter.value.readingTime ?? 0
  countWords()
})

watch(() => route?.path, () => {
  articleRef.value = null
  readingTime.value = frontmatter.value.readingTime ?? 0
  wordCount.value = 0
})

useArticleContentObserver(articleRef, countWords)
</script>

<template>
  <div v-if="config?.enable !== false" class="shuimo-reading-info">
    <!-- Original content badge -->
    <span v-if="isOriginal && config?.originalMark" class="shuimo-reading-info__original">
      {{ t('shuimo.original') }}
    </span>
    <!-- Word count -->
    <span v-if="config?.wordCount !== false && wordCount > 0" class="shuimo-reading-info__item">
      {{ t('shuimo.word_count', { count: wordCount }) }}
    </span>
    <!-- Reading time estimate -->
    <span v-if="config?.readingTime !== false && readingTime > 0" class="shuimo-reading-info__item">
      {{ t('shuimo.reading_time', { min: readingTime }) }}
    </span>
    <!-- Last updated date -->
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

// Bordered badge for original content
.shuimo-reading-info__original {
  padding: 1px 6px;
  border: 1px solid var(--sm-accent);
  color: var(--sm-accent);
  border-radius: 2px;
  font-size: 10px;
  letter-spacing: 1px;
}

// Dot separator between items
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
