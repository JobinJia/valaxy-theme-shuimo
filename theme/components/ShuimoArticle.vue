<script setup lang="ts">
import { usePostTitle, usePrevNext } from 'valaxy'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useThemeConfig } from '../composables'

defineOptions({ name: 'ShuimoArticle' })

const route = useRoute()
const themeConfig = useThemeConfig()
const title = usePostTitle(route)
const [prev, next] = usePrevNext()

const frontmatter = computed(() => route.meta.frontmatter as any)
</script>

<template>
  <article class="shuimo-article">
    <!-- 文章头 -->
    <header class="shuimo-article__header">
      <h1 class="shuimo-article__title">
        {{ title }}
      </h1>
      <ShuimoBrushLine
        variant="ink"
        :length="40"
        :width="2"
        color="var(--sm-stamp)"
        class="shuimo-article__title-line"
      />
      <div class="shuimo-article__meta">
        <ShuimoDate :date="frontmatter?.date" />
        <span v-if="frontmatter?.categories" class="shuimo-article__cat">
          · {{ Array.isArray(frontmatter.categories) ? frontmatter.categories.join(' / ') : frontmatter.categories }}
        </span>
      </div>
    </header>

    <!-- 正文 -->
    <div class="shuimo-article-content">
      <ValaxyMd :frontmatter="frontmatter" />
    </div>

    <!-- 落款印章 -->
    <div v-if="themeConfig?.stamp?.enable !== false" class="shuimo-article__stamp">
      <ShuimoStamp
        :text="themeConfig?.stamp?.author || '墨'"
        :type="themeConfig?.stamp?.type || 'yin'"
        :shape="themeConfig?.stamp?.shape || 'auto'"
        :size="40"
      />
    </div>

    <!-- 上/下篇导航 -->
    <nav class="shuimo-article__nav">
      <router-link
        v-if="prev"
        :to="prev.path || ''"
        class="shuimo-article__nav-item shuimo-article__nav-prev"
      >
        <span class="shuimo-article__nav-label">上一篇</span>
        <span class="shuimo-article__nav-title">{{ prev.title }}</span>
      </router-link>
      <div v-else />
      <router-link
        v-if="next"
        :to="next.path || ''"
        class="shuimo-article__nav-item shuimo-article__nav-next"
      >
        <span class="shuimo-article__nav-label">下一篇</span>
        <span class="shuimo-article__nav-title">{{ next.title }}</span>
      </router-link>
    </nav>
  </article>
</template>

<style lang="scss" scoped>
.shuimo-article {
  padding: 32px 24px;
  border-radius: 3px;
  position: relative;
  overflow: hidden;
  background: var(--sm-content-bg);
  backdrop-filter: blur(1px);

  &__header {
    text-align: center;
    margin-bottom: 32px;
  }

  &__title {
    font-size: 24px;
    color: var(--sm-ink-dark);
    letter-spacing: 4px;
    font-weight: bold;
    line-height: 1.4;
  }

  &__title-line {
    margin: 12px auto;
  }

  &__meta {
    font-size: 12px;
    color: var(--sm-ink-light);
    letter-spacing: 1px;
  }

  &__cat {
    margin-left: 4px;
  }

  &__stamp {
    text-align: right;
    margin-top: 32px;
    padding-top: 16px;
  }

  &__nav-line {
    margin-top: 40px;
  }

  &__nav {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin-top: 12px;
  }

  &__nav-item {
    text-decoration: none;
    max-width: 45%;
  }

  &__nav-label {
    display: block;
    font-size: 10px;
    color: var(--sm-ink-light);
    letter-spacing: 1px;
    margin-bottom: 4px;
  }

  &__nav-title {
    font-size: 13px;
    color: var(--sm-ink-medium);
    transition: color 0.2s;
  }

  &__nav-item:hover &__nav-title {
    color: var(--sm-accent);
  }

  &__nav-next {
    text-align: right;
  }
}

@media (max-width: 767px) {
  .shuimo-article {
    padding: 20px 16px;

    &__title {
      font-size: 20px;
      letter-spacing: 2px;
    }
  }
}
</style>
