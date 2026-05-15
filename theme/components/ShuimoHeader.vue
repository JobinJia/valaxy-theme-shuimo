<script setup lang="ts">
import { useSiteConfig } from 'valaxy'
import { useThemeConfig } from '../composables'

const siteConfig = useSiteConfig()
const themeConfig = useThemeConfig()
</script>

<template>
  <header class="shuimo-header">
    <div class="shuimo-header__title">
      <router-link to="/" class="shuimo-header__home">
        {{ themeConfig?.header?.title || siteConfig.title }}
      </router-link>
    </div>

    <div v-if="themeConfig?.header?.subtitle" class="shuimo-header__subtitle">
      {{ themeConfig.header.subtitle }}
    </div>

    <!-- 笔触装饰线 -->
    <ShuimoBrushLine
      variant="brush"
      :length="240"
      :width="4"
      class="shuimo-header__brush"
    />

    <!-- 导航 -->
    <nav v-if="themeConfig?.nav?.length" class="shuimo-header__nav">
      <template v-for="(item, i) in themeConfig.nav" :key="item.link">
        <span v-if="i > 0" class="shuimo-header__nav-sep">|</span>
        <router-link
          v-if="!item.link.startsWith('http')"
          :to="item.link"
          class="shuimo-header__nav-item"
        >
          <span v-if="item.icon" class="shuimo-header__nav-icon" :class="item.icon" aria-hidden="true" />
          {{ item.text }}
        </router-link>
        <a
          v-else
          :href="item.link"
          target="_blank"
          rel="noopener noreferrer"
          class="shuimo-header__nav-item"
        >
          <span v-if="item.icon" class="shuimo-header__nav-icon" :class="item.icon" aria-hidden="true" />
          {{ item.text }}
        </a>
      </template>
    </nav>
  </header>
</template>

<style lang="scss" scoped>
.shuimo-header {
  text-align: center;
  padding: 36px 20px 16px;

  &__title {
    font-size: 32px;
    color: var(--sm-ink-dark);
    letter-spacing: 10px;
    font-weight: bold;
  }

  &__home {
    color: inherit;
    text-decoration: none;
  }

  &__subtitle {
    font-size: 12px;
    color: var(--sm-ink-light);
    margin-top: 6px;
    letter-spacing: 3px;
  }

  &__brush {
    max-width: 240px;
    margin: 14px auto 0;
  }

  &__nav {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 12px;
    font-size: 13px;
    letter-spacing: 3px;
  }

  &__nav-sep {
    color: var(--sm-c-border-medium);
    user-select: none;
  }

  &__nav-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--sm-ink-medium);
    text-decoration: none;
    transition: color 0.2s;

    &:hover,
    &.router-link-active {
      color: var(--sm-accent);
    }
  }

  &__nav-icon {
    font-size: 1em;
    opacity: 0.8;
  }
}

@media (max-width: 767px) {
  .shuimo-header {
    padding: 28px 16px 14px;

    &__title {
      font-size: 24px;
      letter-spacing: 6px;
    }

    &__subtitle {
      font-size: 11px;
      letter-spacing: 2px;
      margin-top: 4px;
    }

    &__brush {
      max-width: 160px;
      margin-top: 10px;
    }

    &__nav {
      gap: 14px;
      font-size: 12px;
      letter-spacing: 2px;
      flex-wrap: wrap;
      margin-top: 10px;
    }
  }
}
</style>
