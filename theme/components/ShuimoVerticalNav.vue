<script setup lang="ts">
import { useSiteConfig } from 'valaxy'
import { computed } from 'vue'
import { useBlankSide, useThemeConfig } from '../composables'

const themeConfig = useThemeConfig()
const siteConfig = useSiteConfig()
const { blankSide } = useBlankSide()

defineProps<{
  revealed?: boolean
}>()

const titleFont = computed(() => themeConfig.value?.fonts?.title)

// 副标题按逗号/顿号分成两列
const subtitleParts = computed(() => {
  const sub = themeConfig.value?.header?.subtitle
  if (!sub)
    return []
  return sub.split(/[，,、]/).map((s: string) => s.trim()).filter(Boolean)
})
</script>

<template>
  <aside class="shuimo-vnav" :class="[`side-${blankSide}`, { revealed }]">
    <!-- 题款布局：固定5列竖排，从右往左 -->
    <div class="shuimo-vnav__columns">
      <!-- 第一列：站名 -->
      <router-link
        to="/"
        class="shuimo-vnav__title"
        :style="titleFont ? { fontFamily: titleFont } : undefined"
      >
        {{ themeConfig?.header?.title || siteConfig.title || '落梅听雪阁' }}
      </router-link>

      <!-- 第二、三列：副标题拆分 -->
      <span
        v-for="(part, i) in subtitleParts"
        :key="i"
        class="shuimo-vnav__subtitle"
        :style="titleFont ? { fontFamily: titleFont } : undefined"
      >
        {{ part }}
      </span>

      <!-- 第三列起：每个导航链接单独一列 -->
      <template v-for="item in themeConfig?.nav" :key="item.link">
        <router-link
          v-if="!item.link.startsWith('http')"
          :to="item.link"
          class="shuimo-vnav__link"
        >
          {{ item.text }}
        </router-link>
        <a
          v-else
          :href="item.link"
          target="_blank"
          rel="noopener noreferrer"
          class="shuimo-vnav__link"
        >
          {{ item.text }}
        </a>
      </template>

      <!-- 印章：盖在题款末尾 -->
      <ShuimoStamp
        v-if="themeConfig?.stamp?.enable !== false"
        :text="themeConfig?.stamp?.author || '墨'"
        :type="themeConfig?.stamp?.type || 'yin'"
        :shape="themeConfig?.stamp?.shape || 'auto'"
        :font-family="titleFont || 'YiShanBeiZhuan, serif'"
        :size="80"
        class="shuimo-vnav__stamp"
      />
    </div>
  </aside>
</template>

<style lang="scss" scoped>
.shuimo-vnav {
  position: fixed;
  top: 0;
  bottom: 0;
  width: 40%;
  z-index: 2;
  pointer-events: none;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 60px 20px 0;
  // 初始隐藏，幕布打开后淡入
  opacity: 0;
  transition: opacity 1s ease 0.6s; // 延迟 0.6s，等幕布拉开一些再出现

  &.revealed {
    opacity: 1;
  }

  &.side-left {
    left: 0;
  }

  &.side-right {
    right: 0;
  }

  // 所有可交互子元素恢复点击
  a, button, :deep(.shuimo-stamp) {
    pointer-events: auto;
  }

  &__columns {
    display: flex;
    flex-direction: row-reverse;
    gap: 16px;
    align-items: flex-start;

    // 每个子元素竖排
    > * {
      writing-mode: vertical-rl;
    }
  }

  &__title {
    font-size: 26px;
    letter-spacing: 10px;
    color: var(--sm-ink-dark);
    text-decoration: none;
    font-weight: bold;
    transition: color 0.2s;

    &:hover {
      color: var(--sm-accent);
    }
  }

  &__col {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__subtitle {
    font-size: 11px;
    color: var(--sm-ink-light);
    letter-spacing: 4px;
  }

  &__links {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__link {
    font-size: 13px;
    letter-spacing: 4px;
    color: var(--sm-ink-medium);
    text-decoration: none;
    transition: color 0.2s;

    &:hover,
    &.router-link-active {
      color: var(--sm-accent);
    }
  }

  &__stamp {
    align-self: flex-end;
    writing-mode: horizontal-tb !important; // 印章不竖排
  }
}

// 移动端隐藏
@media (max-width: 767px) {
  .shuimo-vnav {
    display: none;
  }
}
</style>
