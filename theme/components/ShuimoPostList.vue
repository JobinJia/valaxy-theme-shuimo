<script setup lang="ts">
import { usePostList } from 'valaxy'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  type?: string
}>()

const { t } = useI18n()
const postList = usePostList()

const posts = computed(() => {
  const list = postList.value || []
  if (props.type)
    return list.filter(p => p.type === props.type)
  return list
})
</script>

<template>
  <div class="shuimo-post-list">
    <TransitionGroup name="list">
      <ShuimoArticleCard
        v-for="post in posts"
        :key="post.path"
        :post="post"
      />
    </TransitionGroup>

    <div v-if="!posts.length" class="shuimo-post-list__empty">
      {{ t('shuimo.empty') }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.shuimo-post-list {
  &__empty {
    text-align: center;
    color: var(--sm-ink-light);
    padding: 48px 0;
    font-size: 14px;
    letter-spacing: 2px;
  }
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
