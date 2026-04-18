<script setup lang="ts">
import { useSeriesPosts } from '../composables/useSeriesPosts'

const { seriesName, seriesPosts, currentIndex } = useSeriesPosts()
</script>

<template>
  <nav v-if="seriesName && seriesPosts.length > 1" class="shuimo-series-nav">
    <div class="shuimo-series-nav__header">
      <span class="shuimo-series-nav__label">本卷目录</span>
      <span class="shuimo-series-nav__name">{{ seriesName }}</span>
    </div>

    <ol class="shuimo-series-nav__list">
      <li
        v-for="(post, idx) in seriesPosts"
        :key="post.path"
        class="shuimo-series-nav__item"
        :class="{ 'shuimo-series-nav__item--active': idx === currentIndex }"
      >
        <span class="shuimo-series-nav__order">{{ idx + 1 }}</span>
        <router-link
          v-if="idx !== currentIndex"
          :to="post.path || ''"
          class="shuimo-series-nav__link"
        >
          {{ post.title || '无题' }}
        </router-link>
        <span v-else class="shuimo-series-nav__current">
          {{ post.title || '无题' }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<style lang="scss" scoped>
.shuimo-series-nav {
  width: 100%;
  margin-top: 40px;
  border: 1px solid var(--sm-c-border-medium, rgba(0, 0, 0, 0.12));
  border-radius: 4px;
  padding: 20px 24px;
  background: var(--sm-card-bg);

  &__header {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 16px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--sm-c-border, rgba(0, 0, 0, 0.08));
  }

  &__label {
    font-size: 14px;
    color: var(--sm-ink-light);
    letter-spacing: 3px;
    font-family: var(--sm-font-kai);
    flex-shrink: 0;
  }

  &__name {
    font-size: 15px;
    color: var(--sm-ink-dark);
    letter-spacing: 1px;
    font-weight: bold;
  }

  &__list {
    list-style: none;
    padding: 0;
    margin: 0;
    counter-reset: none;
  }

  &__item {
    display: flex;
    align-items: baseline;
    gap: 10px;
    padding: 6px 0;
    transition: background 0.15s;

    &--active {
      .shuimo-series-nav__order {
        color: var(--sm-accent);
      }
    }
  }

  &__order {
    flex-shrink: 0;
    width: 20px;
    font-size: 12px;
    color: var(--sm-ink-light);
    text-align: right;
    font-family: var(--sm-font-mono, monospace);
  }

  &__link {
    font-size: 13px;
    color: var(--sm-ink-medium);
    text-decoration: none;
    letter-spacing: 0.5px;
    transition: color 0.2s;
    line-height: 1.6;

    &:hover {
      color: var(--sm-accent);
    }
  }

  &__current {
    font-size: 13px;
    color: var(--sm-accent);
    letter-spacing: 0.5px;
    font-weight: bold;
    line-height: 1.6;
  }
}

@media (max-width: 767px) {
  .shuimo-series-nav {
    padding: 16px;
    margin-top: 28px;

    &__header {
      flex-direction: column;
      gap: 4px;
      margin-bottom: 12px;
      padding-bottom: 8px;
    }

    &__label {
      font-size: 13px;
    }

    &__name {
      font-size: 14px;
    }

    &__item {
      padding: 5px 0;
    }

    &__link,
    &__current {
      font-size: 13px;
    }
  }
}
</style>
