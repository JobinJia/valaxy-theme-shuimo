<script setup lang="ts">
import { usePostList } from 'valaxy'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute() as ReturnType<typeof useRoute> | undefined
const categoryName = computed(() => decodeURIComponent((route?.params?.name ?? '') as string))
const postList = usePostList()

const posts = computed(() => {
  return (postList.value || []).filter((post) => {
    const cats = post.categories
    if (Array.isArray(cats))
      return cats.includes(categoryName.value)
    return cats === categoryName.value
  }).sort((a, b) => +new Date(b.date ?? 0) - +new Date(a.date ?? 0))
})
</script>

<template>
  <ShuimoCategoryTagPage :title="categoryName" :posts="posts" type="category" />
</template>

<route lang="yaml">
meta:
  layout: default
</route>
