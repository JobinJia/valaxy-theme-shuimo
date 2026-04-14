<script setup lang="ts">
import { useTags } from 'valaxy'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeConfig } from '../../composables'

const router = useRouter()
function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}

const themeConfig = useThemeConfig()
const author = computed(() => themeConfig.value?.sidebar?.author)
const titleFont = computed(() => themeConfig.value?.fonts?.title)
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

    <h1 class="shuimo-tags-index__title" :style="titleFont ? { fontFamily: titleFont } : undefined">
      标签
    </h1>

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

    <a href="#" class="shuimo-tags-index__back" @click.prevent="goBack">
      归去来兮 ←
    </a>
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
    border: 2px solid rgba(139, 69, 19, 0.15);
  }

  &__title {
    font-size: 20px;
    font-weight: bold;
    color: var(--sm-ink-dark);
    letter-spacing: 6px;
    margin: 0 0 28px;
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
    border: 1px solid var(--sm-c-border, rgba(139, 69, 19, 0.1));
    border-radius: 2px;
    font-family: "楷体", "KaiTi", "STKaiti", serif;
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
    margin-top: 40px;
    font-size: 13px;
    color: var(--sm-ink-light);
    text-decoration: none;
    letter-spacing: 2px;
    font-family: "楷体", "KaiTi", "STKaiti", serif;
    transition: color 0.2s;
    &:hover { color: var(--sm-accent); }
  }
}

@media (max-width: 767px) {
  .shuimo-tags-index {
    padding: 60px 16px 32px;
  }
}
</style>
