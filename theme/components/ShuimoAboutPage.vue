<script setup lang="ts">
import { computed } from 'vue'
import { useThemeConfig } from '../composables'

const themeConfig = useThemeConfig()
const author = computed(() => themeConfig.value?.sidebar?.author)
const titleFont = computed(() => themeConfig.value?.fonts?.title)
</script>

<template>
  <div class="shuimo-about-page">
    <!-- 头像（点击回首页） -->
    <router-link v-if="author?.avatar" to="/" class="shuimo-about-page__avatar-link">
      <img :src="author.avatar" :alt="author?.name || ''" class="shuimo-about-page__avatar">
    </router-link>

    <!-- 名字 -->
    <h1 class="shuimo-about-page__name" :style="titleFont ? { fontFamily: titleFont } : undefined">
      {{ author?.name || '佚名' }}
    </h1>

    <!-- 座右铭 -->
    <p v-if="author?.motto" class="shuimo-about-page__motto">
      {{ author.motto }}
    </p>

    <!-- 毛笔分隔线 -->
    <ShuimoBrushLine variant="light" :length="180" :width="1" class="shuimo-about-page__line" />

    <!-- 正文（来自 about.md，通过子路由渲染） -->
    <div class="shuimo-about-page__content">
      <slot />
    </div>

    <!-- 印章 -->
    <ShuimoStamp
      v-if="themeConfig?.stamp?.enable !== false"
      :text="themeConfig?.stamp?.author || '墨'"
      :type="themeConfig?.stamp?.type || 'yin'"
      :shape="themeConfig?.stamp?.shape || 'auto'"
      :font-family="titleFont || 'serif'"
      :size="64"
      class="shuimo-about-page__stamp"
    />

    <!-- 返回 -->
    <router-link to="/" class="shuimo-about-page__back">
      ← 返回
    </router-link>
  </div>
</template>

<style lang="scss" scoped>
.shuimo-about-page {
  max-width: 450px;
  margin: 0 auto;
  padding: 80px 20px 40px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;

  &__avatar-link {
    display: block;
    margin-bottom: 20px;
  }

  &__avatar {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(139, 69, 19, 0.15);
  }

  &__name {
    font-size: 22px;
    font-weight: bold;
    color: #1a1410;
    letter-spacing: 6px;
    margin: 0 0 8px;
  }

  &__motto {
    font-size: 13px;
    color: var(--sm-ink-light);
    letter-spacing: 2px;
    margin: 0 0 24px;
    font-family: "楷体", "KaiTi", "STKaiti", serif;
  }

  &__line {
    margin-bottom: 24px;
  }

  &__content {
    width: 100%;
    font-size: 14px;
    color: var(--sm-ink-medium);
    line-height: 2;
    letter-spacing: 1px;
    text-align: left;
    font-family: "楷体", "KaiTi", "STKaiti", serif;

    :deep(p) {
      margin: 10px 0;
      text-indent: 2em;
    }

    :deep(a) {
      color: var(--sm-accent);
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }
  }

  &__stamp {
    margin-top: 32px;
  }

  &__back {
    margin-top: 32px;
    font-size: 13px;
    color: var(--sm-ink-light);
    text-decoration: none;
    letter-spacing: 2px;
    font-family: "楷体", "KaiTi", "STKaiti", serif;
    transition: color 0.2s;

    &:hover {
      color: var(--sm-accent);
    }
  }
}
</style>
