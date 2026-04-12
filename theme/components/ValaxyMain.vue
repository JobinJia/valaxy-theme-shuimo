<script setup lang="ts">
import type { PageData, Post } from 'valaxy'

defineProps<{
  frontmatter: Post
  data?: PageData
}>()
</script>

<template>
  <main class="shuimo-article-content">
    <slot name="main-content">
      <ValaxyMd :frontmatter="frontmatter">
        <slot name="main-content-md" />
        <slot />
      </ValaxyMd>
    </slot>
  </main>
</template>
