<script setup lang="ts">
import { useCategories, usePostList, useTags } from 'valaxy'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeConfig } from '../composables'

const router = useRouter()
function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}

const themeConfig = useThemeConfig()
const author = computed(() => themeConfig.value?.sidebar?.author)
const titleFont = computed(() => themeConfig.value?.fonts?.title)

const postList = usePostList()
const categories = useCategories()
const tags = useTags()

const postCount = computed(() => (postList.value || []).length)
const categoryCount = computed(() => categories.value?.children?.size || 0)
const tagCount = computed(() => tags.value?.size || 0)
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

    <!-- 统计卡片：归档 / 分类 / 标签 -->
    <div class="shuimo-about-page__stats">
      <router-link to="/archives" class="shuimo-about-page__stat-card">
        <span class="shuimo-about-page__stat-label">栖墨斋</span>
        <span class="shuimo-about-page__stat-count">{{ postCount }}</span>
      </router-link>
      <router-link to="/categories" class="shuimo-about-page__stat-card">
        <span class="shuimo-about-page__stat-label">分类</span>
        <span class="shuimo-about-page__stat-count">{{ categoryCount }}</span>
      </router-link>
      <router-link to="/tags" class="shuimo-about-page__stat-card">
        <span class="shuimo-about-page__stat-label">标签</span>
        <span class="shuimo-about-page__stat-count">{{ tagCount }}</span>
      </router-link>
    </div>

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
    <a href="#" class="shuimo-about-page__back" @click.prevent="goBack">
      归去来兮 ←
    </a>
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
    color: var(--sm-ink-dark);
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

  &__stats {
    display: flex;
    gap: 1px;
    width: 100%;
    margin-bottom: 24px;
    border: 1px solid var(--sm-c-border, rgba(139, 69, 19, 0.1));
    border-radius: 4px;
    overflow: hidden;
  }

  &__stat-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px 8px;
    text-decoration: none;
    background: var(--sm-card-bg);
    transition: background 0.2s;

    &:hover {
      background: var(--sm-sidebar-bg);
    }

    &:not(:last-child) {
      border-right: 1px solid var(--sm-c-border, rgba(139, 69, 19, 0.1));
    }
  }

  &__stat-label {
    font-size: 12px;
    color: var(--sm-ink-light);
    letter-spacing: 2px;
    margin-bottom: 4px;
  }

  &__stat-count {
    font-size: 20px;
    font-weight: bold;
    color: var(--sm-ink-dark);
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

@media (max-width: 767px) {
  .shuimo-about-page {
    padding: 60px 16px 32px;

    &__avatar {
      width: 56px;
      height: 56px;
    }

    &__name {
      font-size: 18px;
      letter-spacing: 4px;
    }

    &__content {
      font-size: 13px;
    }
  }
}
</style>
