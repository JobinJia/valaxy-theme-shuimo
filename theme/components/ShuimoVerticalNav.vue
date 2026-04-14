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

// 菜单在标题的对面
const menuSide = computed(() => blankSide.value === 'right' ? 'left' : 'right')

// 副标题按逗号/顿号分成两列
const subtitleParts = computed(() => {
  const sub = themeConfig.value?.header?.subtitle
  if (!sub)
    return []
  return sub.split(/[，,、]/).map((s: string) => s.trim()).filter(Boolean)
})
</script>

<template>
  <!-- 标题区域：头像、站名、副标题、印章 -->
  <aside class="shuimo-vnav shuimo-vnav--title" :class="[`side-${blankSide}`, { revealed }]">
    <div class="shuimo-vnav__columns">
      <router-link v-if="themeConfig?.sidebar?.author?.avatar" to="/" class="shuimo-vnav__avatar-link">
        <img
          :src="themeConfig.sidebar.author.avatar"
          :alt="themeConfig.sidebar.author.name || ''"
          class="shuimo-vnav__avatar"
        >
      </router-link>

      <router-link
        to="/"
        class="shuimo-vnav__title"
        :style="titleFont ? { fontFamily: titleFont } : undefined"
      >
        {{ themeConfig?.header?.title || siteConfig.title || '落梅听雪阁' }}
      </router-link>

      <span
        v-for="(part, i) in subtitleParts"
        :key="i"
        class="shuimo-vnav__subtitle"
        :style="titleFont ? { fontFamily: titleFont } : undefined"
      >
        {{ part }}
      </span>

      <!-- 移动端：菜单印章紧跟副标题之后 -->
      <template v-for="item in themeConfig?.nav" :key="`mobile-${item.link}`">
        <router-link
          v-if="!item.link.startsWith('http')"
          :to="item.link"
          class="shuimo-vnav__link-stamp shuimo-vnav__link-stamp--mobile"
        >
          <ShuimoStamp
            :text="item.text"
            type="yang"
            shape="ellipse"
            :font-family="titleFont || 'YiShanBeiZhuan, serif'"
            :size="40"
          />
        </router-link>
        <a
          v-else
          :href="item.link"
          target="_blank"
          rel="noopener noreferrer"
          class="shuimo-vnav__link-stamp shuimo-vnav__link-stamp--mobile"
        >
          <ShuimoStamp
            :text="item.text"
            type="yang"
            shape="ellipse"
            :font-family="titleFont || 'YiShanBeiZhuan, serif'"
            :size="40"
          />
        </a>
      </template>

      <!-- 大印章（移动端在最左，桌面端在最下） -->
      <ShuimoStamp
        v-if="themeConfig?.stamp?.enable !== false"
        :text="themeConfig?.stamp?.author || '墨'"
        :type="themeConfig?.stamp?.type || 'yin'"
        :shape="themeConfig?.stamp?.shape || 'auto'"
        :font-family="titleFont || 'YiShanBeiZhuan, serif'"
        :size="56"
        class="shuimo-vnav__stamp"
      />
    </div>
  </aside>

  <!-- 菜单区域：导航链接，在标题的对面（仅桌面端） -->
  <aside class="shuimo-vnav shuimo-vnav--menu" :class="[`side-${menuSide}`, { revealed }]">
    <div class="shuimo-vnav__columns">
      <template v-for="item in themeConfig?.nav" :key="item.link">
        <router-link
          v-if="!item.link.startsWith('http')"
          :to="item.link"
          class="shuimo-vnav__link-stamp"
        >
          <ShuimoStamp
            :text="item.text"
            type="yang"
            shape="ellipse"
            :font-family="titleFont || 'YiShanBeiZhuan, serif'"
            :size="48"
          />
        </router-link>
        <a
          v-else
          :href="item.link"
          target="_blank"
          rel="noopener noreferrer"
          class="shuimo-vnav__link-stamp"
        >
          <ShuimoStamp
            :text="item.text"
            type="yang"
            shape="ellipse"
            :font-family="titleFont || 'YiShanBeiZhuan, serif'"
            :size="48"
          />
        </a>
      </template>
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

  &__avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(139, 69, 19, 0.2);
    margin-bottom: 16px;
  }

  // 所有可交互子元素恢复点击
  a, button, :deep(.shuimo-stamp), &__avatar-link {
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

  &__subtitle {
    font-size: 11px;
    color: var(--sm-ink-light);
    letter-spacing: 4px;
  }

  &__link {
    font-size: 13px;
    letter-spacing: 4px;
    color: var(--sm-ink-medium);
    font-family: "楷体", "KaiTi", "STKaiti", serif;
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

  &__link-stamp {
    writing-mode: horizontal-tb !important; // 印章不竖排
    text-decoration: none;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.7;
    }

    // 移动端菜单印章默认隐藏（桌面端由单独的 menu aside 显示）
    &--mobile {
      display: none;
    }
  }
}

// 移动端
@media (max-width: 767px) {
  .shuimo-vnav {
    // 标题 aside：从固定定位改为流式，贴右
    &--title {
      position: static;
      width: 100%;
      padding: 24px 16px 20px 0;
      opacity: 1 !important;
      transition: none;
      pointer-events: auto;
      display: flex;
      justify-content: flex-end !important;

      .shuimo-vnav__columns {
        gap: 8px;
        display: inline-flex;
      }
    }

    // 菜单 aside：移动端隐藏（菜单印章已放入标题 aside 中）
    &--menu {
      display: none;
    }

    &__avatar-link {
      display: none;
    }

    &__title {
      font-size: 20px;
      letter-spacing: 6px;
    }

    &__subtitle {
      font-size: 10px;
      letter-spacing: 3px;
    }

    // 移动端显示内嵌的菜单印章
    &__link-stamp--mobile {
      display: block;
    }
  }
}
</style>
