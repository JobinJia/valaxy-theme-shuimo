<script setup lang="ts">
import { useCategories } from 'valaxy'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGoBack, useThemeConfig } from '../../composables'

const { t } = useI18n()

const { goBack } = useGoBack()

const themeConfig = useThemeConfig()
const author = computed(() => themeConfig.value?.sidebar?.author)
const categories = useCategories()

const categoryList = computed(() => {
  const list: { name: string, count: number }[] = []
  categories.value?.children?.forEach((cat, name) => {
    list.push({ name: String(name), count: cat.total || 0 })
  })
  return list.sort((a, b) => b.count - a.count)
})
</script>

<template>
  <div class="shuimo-categories-index">
    <router-link v-if="author?.avatar" to="/" class="shuimo-categories-index__avatar-link">
      <img :src="author.avatar" :alt="author?.name || ''" class="shuimo-categories-index__avatar">
    </router-link>

    <ShuimoTiqian :title="t('shuimo.categories_title')" class="shuimo-categories-index__tiqian" />

    <div class="shuimo-categories-index__list">
      <router-link
        v-for="cat in categoryList"
        :key="cat.name"
        :to="`/categories/${cat.name}`"
        class="shuimo-categories-index__item"
      >
        <span class="shuimo-categories-index__name">{{ cat.name }}</span>
        <span class="shuimo-categories-index__count">{{ cat.count }}</span>
      </router-link>
    </div>

    <a href="#" class="shuimo-categories-index__back" @click.prevent="goBack">
      {{ t('shuimo.back') }} ←
    </a>
  </div>
</template>

<route lang="yaml">
meta:
  layout: default
</route>

<style lang="scss" scoped>
.shuimo-categories-index {
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
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--sm-primary-light);
  }

  &__tiqian {
    margin-bottom: 28px;
  }

  &__list {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: center;
  }

  &__item {
    display: flex;
    align-items: baseline;
    gap: 6px;
    padding: 8px 16px;
    text-decoration: none;
    border: 1px solid var(--sm-c-border);
    border-radius: 3px;
    transition: all 0.2s;

    &:hover {
      border-color: var(--sm-accent);
      .shuimo-categories-index__name {
        color: var(--sm-accent);
      }
    }
  }

  &__name {
    font-size: 14px;
    color: var(--sm-ink-medium);
    letter-spacing: 1px;
    font-family: var(--sm-font-kai);
    transition: color 0.2s;
  }

  &__count {
    font-size: 11px;
    color: var(--sm-ink-light);
  }

  &__back {
    margin-top: 40px;
    font-size: 13px;
    color: var(--sm-ink-light);
    text-decoration: none;
    letter-spacing: 2px;
    font-family: var(--sm-font-kai);
    transition: color 0.2s;
    &:hover {
      color: var(--sm-accent);
    }
  }
}

@media (max-width: 767px) {
  .shuimo-categories-index {
    padding: 60px 16px 32px;
  }
}
</style>
