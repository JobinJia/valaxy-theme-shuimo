<script setup lang="ts">
import { useTags } from 'valaxy'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGoBack, useThemeConfig } from '../../composables'

const { t } = useI18n()

const { goBack } = useGoBack()

const themeConfig = useThemeConfig()
const author = computed(() => themeConfig.value?.sidebar?.author)
const tags = useTags()

const tagList = computed(() => {
  const list: { name: string, count: number }[] = []
  tags.value?.forEach((val, name) => {
    list.push({ name: String(name), count: val.count || 0 })
  })
  return list.sort((a, b) => b.count - a.count)
})
</script>

<template>
  <div class="shuimo-tags-index">
    <router-link v-if="author?.avatar" to="/" class="shuimo-tags-index__avatar-link">
      <img :src="author.avatar" :alt="author?.name || ''" class="shuimo-tags-index__avatar">
    </router-link>

    <ShuimoTiqian :title="t('shuimo.tags_title')" class="shuimo-tags-index__tiqian" />

    <div class="shuimo-tags-index__cloud">
      <router-link
        v-for="tag in tagList"
        :key="tag.name"
        :to="`/tags/${tag.name}`"
        class="shuimo-tags-index__tag"
      >
        {{ tag.name }}
        <sup>{{ tag.count }}</sup>
      </router-link>
    </div>

    <button type="button" class="shuimo-tags-index__back" @click="goBack">
      {{ t('shuimo.back') }} ←
    </button>
  </div>
</template>

<route lang="yaml">
meta:
  layout: default
</route>

<style lang="scss" scoped>
.shuimo-tags-index {
  max-width: 450px;
  margin: 0 auto;
  padding: 80px 20px 40px;
  min-height: 100vh;
  min-height: 100dvh;
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

  &__cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: center;
  }

  &__tag {
    padding: 4px 12px;
    font-size: 13px;
    color: var(--sm-ink-medium);
    text-decoration: none;
    border: 1px solid var(--sm-c-border);
    border-radius: 2px;
    font-family: var(--sm-font-kai);
    letter-spacing: 1px;
    transition: all 0.2s;

    sup {
      font-size: 9px;
      color: var(--sm-ink-light);
      margin-left: 2px;
    }

    &:hover {
      color: var(--sm-accent);
      border-color: var(--sm-accent);
    }
  }

  &__back {
    border: 0;
    background: none;
    padding: 0;
    cursor: pointer;
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
  .shuimo-tags-index {
    padding: 60px 16px 32px;
  }
}
</style>
