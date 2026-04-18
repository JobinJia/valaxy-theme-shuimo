<script setup lang="ts">
import type { Post } from 'valaxy'

defineProps<{
  post: Post
}>()
</script>

<template>
  <article class="shuimo-card">
    <router-link :to="post.path || ''" class="shuimo-card__link">
      <h2 class="shuimo-card__title">
        {{ post.title }}
      </h2>
    </router-link>

    <ShuimoBrushLine
      variant="ink"
      :length="100"
      :width="3"
      class="shuimo-card__line"
    />

    <div class="shuimo-card__meta">
      <ShuimoDate :date="post.date ? String(post.date) : undefined" />
      <span v-if="post.categories" class="shuimo-card__cat">
        · {{ Array.isArray(post.categories) ? post.categories.join(' / ') : post.categories }}
      </span>
    </div>

    <p v-if="post.excerpt" class="shuimo-card__excerpt" v-html="post.excerpt" />

    <div class="shuimo-card__read-more">
      <router-link :to="post.path || ''">
        阅读全文 →
      </router-link>
    </div>
  </article>
</template>

<style lang="scss" scoped>
.shuimo-card {
  margin-bottom: 28px;
  padding: 20px;
  border-radius: 3px;
  background: var(--sm-card-bg);

  &__link {
    text-decoration: none;
  }

  &__title {
    font-size: 18px;
    color: var(--sm-ink-dark);
    letter-spacing: 2px;
    font-weight: bold;
    margin-bottom: 6px;
    transition: color 0.2s;

    &:hover {
      color: var(--sm-accent);
    }
  }

  &__line {
    width: 100px;
    margin-bottom: 8px;
  }

  &__meta {
    font-size: 11px;
    color: var(--sm-ink-light);
    margin-bottom: 10px;
  }

  &__cat {
    margin-left: 4px;
  }

  &__excerpt {
    font-size: 14px;
    color: var(--sm-ink-medium);
    line-height: 1.9;
    text-indent: 2em;
    text-align: justify;
  }

  &__read-more {
    text-align: right;
    margin-top: 10px;

    a {
      font-size: 12px;
      color: var(--sm-accent);
      text-decoration: none;
      letter-spacing: 1px;
      border-bottom: 1px solid var(--sm-accent);
      padding-bottom: 1px;

      &:hover {
        opacity: 0.8;
      }
    }
  }
}

@media (max-width: 767px) {
  .shuimo-card {
    padding: 16px;
    margin-bottom: 20px;

    &__title {
      font-size: 16px;
    }

    &__excerpt {
      font-size: 13px;
    }
  }
}
</style>
