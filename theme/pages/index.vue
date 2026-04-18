<script setup lang="ts">
import { computed } from 'vue'
import { useThemeConfig } from '../composables'

const themeConfig = useThemeConfig()
const preface = computed(() => themeConfig.value?.preface)
</script>

<template>
  <ShuimoPreface
    v-if="preface?.quote"
    :quote="preface.quote"
    :source="preface.source"
  />
  <ShuimoPostList />
</template>

<route lang="yaml">
meta:
  layout: home
</route>
