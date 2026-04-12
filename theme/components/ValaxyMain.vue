<script setup lang="ts">
import type { PageData, Post } from 'valaxy'

defineProps<{
  frontmatter: Post
  data?: PageData
}>()
</script>

<template>
  <main class="shuimo-article-content xuan-paper-light" p="x-4 y-6">
    <slot name="main-header" />

    <slot name="main">
      <slot name="main-content">
        <ValaxyMd :frontmatter="frontmatter" />
      </slot>

      <slot name="main-nav-before" />
      <slot name="main-nav" />
      <slot name="main-nav-after" />
    </slot>

    <slot name="comment" />
  </main>
</template>
