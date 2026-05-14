<script setup lang="ts">
/**
 * Post layout — Article page with TOC, reading info, image captions, and stamp.
 *
 * Uses `:key="route.path"` on the container to force full remount on SPA
 * navigation, ensuring all client-side features (TOC, word count, stamp)
 * reinitialize correctly for each post.
 */
import { useSiteStore } from 'valaxy'
import { computed, inject, ref } from 'vue'
import type { Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useImageCaption, useThemeConfig } from '../composables'
import { CURRENT_ROUTE_PATH_KEY, ROUTER_KEY } from '../composables/useCurtainTransition'

const { t } = useI18n()
const themeConfig = useThemeConfig()
const author = computed(() => themeConfig.value?.sidebar?.author)
const stampConfig = computed(() => themeConfig.value?.stamp)
const route = useRoute() as ReturnType<typeof useRoute> | undefined
// useRouter() can return undefined here under duplicate vue-router instances
// (consumer's copy vs. theme's copy → routerKey symbol mismatch). Prefer the
// router provided by theme/setup/main.ts, fall back to useRouter() when the
// theme is consumed outside the standard provide wiring.
const router = inject(ROUTER_KEY, null) ?? useRouter()
const frontmatter = computed(() => (route?.meta?.frontmatter || {}) as any)

// Inline prev/next: Valaxy's usePrevNext compares route.path === post.path,
// but SSR's ctx.routePath omits the trailing slash while client history mode
// keeps it ("/posts/x" vs "/posts/x/"), so SSR finds index=N+1 and client
// finds -1 — different prev/next, hydration mismatch. Strip slashes both sides.
const site = useSiteStore()
const routePathRef = inject(CURRENT_ROUTE_PATH_KEY, ref('/')) as Ref<string>
function stripSlash(p: string | undefined): string {
  if (!p)
    return '/'
  return p.replace(/\/$/, '') || '/'
}
const currentPostIndex = computed(() => {
  const current = stripSlash(routePathRef.value)
  return (site.postList || []).findIndex((p: any) => stripSlash(p.path) === current)
})
const prev = computed(() => {
  const i = currentPostIndex.value
  return i - 1 >= 0 ? (site.postList || [])[i - 1] : null
})
const next = computed(() => {
  const i = currentPostIndex.value
  const list = site.postList || []
  return i >= 0 && i + 1 < list.length ? list[i + 1] : null
})

const articleRef = ref<HTMLElement>()
const imageCaptionConfig = computed(() => themeConfig.value?.imageCaption || {})

// Merge per-post frontmatter stamp config with global theme stamp config.
// Frontmatter values take priority over global defaults.
const postStamp = computed(() => {
  const fm = frontmatter.value.stamp || {}
  const global = stampConfig.value || {}
  return {
    enable: fm.enable ?? global.enable ?? true,
    text: fm.text ?? fm.author ?? global.author ?? '受命,于天,既寿,永昌',
    type: fm.type ?? global.type ?? 'yang',
    shape: fm.shape ?? global.shape ?? 'rectangle',
    color: fm.color ?? global.color,
    size: fm.size ?? global.size,
    fontFamily: fm.fontFamily ?? global.fontFamily,
    fontSize: fm.fontSize ?? global.fontSize,
    fontWeight: fm.fontWeight ?? global.fontWeight,
    textCarving: fm.textCarving ?? global.textCarving,
    offsetX: fm.offsetX ?? global.offsetX,
    offsetY: fm.offsetY ?? global.offsetY,
    columnSpacing: fm.columnSpacing ?? global.columnSpacing,
    characterSpacing: fm.characterSpacing ?? global.characterSpacing,
    paddingX: fm.paddingX ?? global.paddingX,
    paddingY: fm.paddingY ?? global.paddingY,
    borderScaleX: fm.borderScaleX ?? global.borderScaleX,
    borderScaleY: fm.borderScaleY ?? global.borderScaleY,
    borderScale: fm.borderScale ?? global.borderScale,
    columnSpacingPx: fm.columnSpacingPx ?? global.columnSpacingPx,
    characterSpacingPx: fm.characterSpacingPx ?? global.characterSpacingPx,
    paddingXPx: fm.paddingXPx ?? global.paddingXPx,
    paddingYPx: fm.paddingYPx ?? global.paddingYPx,
    noiseAmountPx: fm.noiseAmountPx ?? global.noiseAmountPx,
    borderPointsPx: fm.borderPointsPx ?? global.borderPointsPx,
    cornerRadiusPx: fm.cornerRadiusPx ?? global.cornerRadiusPx,
    borderWidthPx: fm.borderWidthPx ?? global.borderWidthPx,
    regularShape: fm.regularShape ?? global.regularShape,
    seed: fm.seed ?? global.seed,
  }
})

// Enhance images with figure captions
useImageCaption(articleRef, imageCaptionConfig)

function goBack() {
  if (window.history.length > 1) {
    if (router)
      router.back()
    else
      window.history.back()
  }
  else if (router) {
    router.push('/')
  }
  else {
    window.location.assign('/')
  }
}
</script>

<template>
  <ShuimoClickPetals />
  <ShuimoLayout>
    <div :key="route?.path" class="shuimo-post-page">
      <!-- 顶部返回 -->
      <a href="#" class="shuimo-post-page__back shuimo-post-page__back--top" @click.prevent="goBack">
        ← {{ t('shuimo.back') }}
      </a>

      <!-- 头像回首页 -->
      <router-link v-if="author?.avatar" to="/" class="shuimo-post-page__avatar-link">
        <img :src="author.avatar" :alt="author?.name || ''" class="shuimo-post-page__avatar">
      </router-link>

      <!-- 文章标题 -->
      <h1 class="shuimo-post-page__title">
        {{ frontmatter.title || '无题' }}
      </h1>

      <!-- 日期 + 分类 -->
      <div class="shuimo-post-page__meta">
        <span v-if="frontmatter.date">{{ new Date(frontmatter.date).toLocaleDateString('zh-CN') }}</span>
        <span v-if="frontmatter.categories"> · {{ Array.isArray(frontmatter.categories) ? frontmatter.categories.join(' / ') : frontmatter.categories }}</span>
      </div>

      <!-- 阅读信息 -->
      <ShuimoReadingInfo />

      <ShuimoBrushLine variant="light" :length="200" :width="1" class="shuimo-post-page__line" />

      <!-- 移动端目录 -->
      <ShuimoToc />

      <!-- 文章正文：页面作为子路由，必须用 RouterView 渲染 -->
      <article ref="articleRef" class="shuimo-post-page__content markdown-body shuimo-article-content">
        <RouterView />
      </article>

      <!-- 落款印章 -->
      <div v-if="postStamp.enable" class="shuimo-post-page__stamp">
        <ShuimoStamp
          :text="postStamp.text"
          :type="postStamp.type"
          :shape="postStamp.shape"
          :size="postStamp.size || 200"
          :color="postStamp.color"
          :font-family="postStamp.fontFamily"
          :font-size="postStamp.fontSize"
          :font-weight="postStamp.fontWeight"
          :text-carving="postStamp.textCarving"
          :offset-x="postStamp.offsetX"
          :offset-y="postStamp.offsetY"
          :column-spacing="postStamp.columnSpacing"
          :character-spacing="postStamp.characterSpacing"
          :padding-x="postStamp.paddingX"
          :padding-y="postStamp.paddingY"
          :border-scale="postStamp.borderScale"
          :column-spacing-px="postStamp.columnSpacingPx"
          :character-spacing-px="postStamp.characterSpacingPx"
          :padding-x-px="postStamp.paddingXPx"
          :padding-y-px="postStamp.paddingYPx"
          :border-scale-x="postStamp.borderScaleX"
          :border-scale-y="postStamp.borderScaleY"
          :noise-amount-px="postStamp.noiseAmountPx"
          :border-points-px="postStamp.borderPointsPx"
          :corner-radius-px="postStamp.cornerRadiusPx"
          :border-width-px="postStamp.borderWidthPx"
          :regular-shape="postStamp.regularShape"
          :seed="postStamp.seed"
        />
      </div>

      <!-- 系列文章导航 -->
      <ShuimoSeriesNav />

      <!-- 上一篇 / 下一篇 -->
      <nav v-if="prev || next" class="shuimo-post-page__nav">
        <router-link
          v-if="prev"
          :to="prev.path || ''"
          class="shuimo-post-page__nav-item shuimo-post-page__nav-prev"
        >
          <span class="shuimo-post-page__nav-label">{{ t('shuimo.prev_post') }}</span>
          <span class="shuimo-post-page__nav-title">{{ prev.title }}</span>
        </router-link>
        <span v-else />
        <router-link
          v-if="next"
          :to="next.path || ''"
          class="shuimo-post-page__nav-item shuimo-post-page__nav-next"
        >
          <span class="shuimo-post-page__nav-label">{{ t('shuimo.next_post') }}</span>
          <span class="shuimo-post-page__nav-title">{{ next.title }}</span>
        </router-link>
      </nav>

      <!-- 返回上一页 -->
      <a href="#" class="shuimo-post-page__back" @click.prevent="goBack">
        {{ t('shuimo.back') }} ←
      </a>
    </div>
  </ShuimoLayout>
</template>

<style lang="scss" scoped>
// 隐藏 Header（站名/副标题/导航）
:deep(.shuimo-header) {
  display: none;
}

.shuimo-post-page {
  max-width: 680px;
  margin: 0 auto;
  padding: 60px 24px 40px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-x: hidden;

  &__avatar-link {
    display: block;
    margin-bottom: 24px;
  }

  &__avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--sm-primary-light);
  }

  &__title {
    font-size: 22px;
    font-weight: bold;
    color: var(--sm-ink-dark);
    letter-spacing: 4px;
    margin: 0 0 12px;
    text-align: center;
  }

  &__meta {
    font-size: 12px;
    color: var(--sm-ink-light);
    letter-spacing: 1px;
    margin-bottom: 20px;
  }

  &__line {
    margin-bottom: 28px;
  }

  &__content {
    width: 100%;
    font-size: 15px;
    color: var(--sm-ink-medium);
    line-height: 2;
    letter-spacing: 0.5px;

    :deep(h2) {
      font-size: 18px;
      color: var(--sm-ink-dark);
      letter-spacing: 3px;
      margin: 32px 0 16px;
      font-weight: bold;
    }

    :deep(h3) {
      font-size: 16px;
      color: var(--sm-ink-dark);
      letter-spacing: 2px;
      margin: 24px 0 12px;
    }

    :deep(p) {
      margin: 12px 0;
      text-indent: 2em;
    }

    :deep(blockquote) {
      margin: 16px 0;
      padding: 12px 20px;
      border-left: 3px solid var(--sm-c-border-medium);
      color: var(--sm-ink-light);
      font-style: italic;

      p {
        text-indent: 0;
      }
    }

    :deep(img) {
      max-width: 100%;
      height: auto;
      border-radius: 3px;
      display: block;
      margin: 16px auto;
    }

    :deep(table) {
      width: 100%;
      overflow-x: auto;
      display: block;
      -webkit-overflow-scrolling: touch;
    }

    :deep(pre) {
      background: var(--sm-paper-card);
      border-radius: 4px;
      padding: 16px;
      overflow-x: auto;
      margin: 16px 0;
      font-size: 13px;
      line-height: 1.6;
    }

    :deep(code:not(pre code)) {
      background: var(--sm-paper-card);
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 0.9em;
    }

    :deep(a) {
      color: var(--sm-accent);
      text-decoration: none;
      &:hover {
        text-decoration: underline;
      }
    }
  }

  &__stamp {
    width: 100%;
    display: flex;
    justify-content: flex-end;
    margin-top: 32px;
  }

  &__nav {
    width: 100%;
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin-top: 32px;
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

  &__back {
    font-size: 13px;
    color: var(--sm-ink-light);
    text-decoration: none;
    letter-spacing: 2px;
    font-family: var(--sm-font-kai);
    transition: color 0.2s;
    margin-top: 40px;

    &:hover {
      color: var(--sm-accent);
    }

    &--top {
      align-self: flex-start;
      margin-top: 0;
      margin-bottom: 16px;
    }
  }
}

@media (max-width: 767px) {
  .shuimo-post-page {
    padding: 32px 16px 28px;
    box-sizing: border-box;
    width: 100%;

    &__avatar {
      width: 32px;
      height: 32px;
    }

    &__avatar-link {
      margin-bottom: 12px;
    }

    &__title {
      font-size: 18px;
      letter-spacing: 2px;
      margin: 0 0 8px;
      line-height: 1.5;
    }

    &__meta {
      font-size: 11px;
      margin-bottom: 12px;
    }

    &__line {
      margin-bottom: 16px;
    }

    &__content {
      font-size: 15px;
      line-height: 1.85;
      letter-spacing: 0.3px;

      :deep(h2) {
        font-size: 17px;
        letter-spacing: 1.5px;
        margin: 24px 0 12px;
      }

      :deep(h3) {
        font-size: 15px;
        letter-spacing: 1px;
        margin: 20px 0 10px;
      }

      :deep(p) {
        text-indent: 2em;
        margin: 10px 0;
      }

      :deep(pre) {
        padding: 12px 10px;
        font-size: 12px;
        overflow-x: auto;
      }

      :deep(blockquote) {
        padding: 8px 12px;
        margin: 12px 0;
      }

      :deep(img) {
        max-width: 100%;
        height: auto;
      }

      :deep(table) {
        font-size: 13px;
        display: block;
        overflow-x: auto;

        th,
        td {
          padding: 6px 8px;
        }
      }

      :deep(ul),
      :deep(ol) {
        padding-left: 1.5em;
      }

      :deep(code:not(pre code)) {
        font-size: 0.85em;
        padding: 1px 4px;
      }
    }

    &__back {
      margin-top: 28px;
    }
  }
}
</style>
