<script setup lang="ts">
import { usePostList } from 'valaxy'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const tagName = computed(() => decodeURIComponent(route.params.name as string))
const postList = usePostList()

const posts = computed(() => {
  return (postList.value || []).filter((post) => {
    const tags = post.tags
    if (Array.isArray(tags))
      return tags.includes(tagName.value)
    return tags === tagName.value
  }).sort((a, b) => +new Date(b.date ?? 0) - +new Date(a.date ?? 0))
})
</script>

<template>
  <ShuimoCategoryTagPage :title="tagName" :posts="posts" type="tag" />
</template>

<route lang="yaml">
meta:
  layout: default
</route>
