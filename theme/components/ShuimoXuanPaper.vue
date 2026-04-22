<script setup lang="ts">
import { onMounted } from 'vue'

const emit = defineEmits<{
  loaded: []
}>()

onMounted(() => emit('loaded'))
</script>

<template>
  <div class="shuimo-xuan-paper">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.shuimo-xuan-paper {
  position: relative;
}
</style>
