<script setup lang="ts">
import { ref } from 'vue'
import { refreshSeed } from '../composables'

defineProps<{
  seed: number
}>()

const emit = defineEmits<{
  refresh: []
}>()

const copied = ref(false)

async function copySeed(seed: number) {
  try {
    await navigator.clipboard.writeText(String(seed))
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 1500)
  }
  catch {}
}

function regenerate() {
  refreshSeed()
  emit('refresh')
  window.location.reload()
}
</script>

<template>
  <div class="shuimo-seed-control">
    <span class="shuimo-seed-control__label">seed</span>
    <span class="shuimo-seed-control__value">{{ seed }}</span>
    <button
      class="shuimo-seed-control__btn"
      :title="copied ? '已复制' : '复制 seed'"
      @click="copySeed(seed)"
    >
      {{ copied ? '✓' : '⎘' }}
    </button>
    <button
      class="shuimo-seed-control__btn"
      title="随机重生"
      @click="regenerate"
    >
      ↻
    </button>
  </div>
</template>

<style lang="scss" scoped>
.shuimo-seed-control {
  position: fixed;
  bottom: 16px;
  left: 16px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--sm-paper-card);
  border: 1px solid var(--sm-border-light);
  border-radius: 6px;
  font-size: 12px;
  color: var(--sm-ink-light);
  opacity: 0.6;
  transition: opacity 0.2s;
  font-family: var(--sm-font-mono);

  &:hover {
    opacity: 1;
  }

  &__label {
    color: var(--sm-ink-light);
    user-select: none;
  }

  &__value {
    color: var(--sm-accent);
    font-weight: 600;
    letter-spacing: 1px;
  }

  &__btn {
    background: none;
    border: none;
    color: var(--sm-ink-medium);
    cursor: pointer;
    font-size: 14px;
    padding: 2px 4px;
    border-radius: 4px;
    transition:
      background 0.15s,
      color 0.15s;
    line-height: 1;

    &:hover {
      background: var(--sm-primary-faint);
      color: var(--sm-accent);
    }
  }
}

@media (max-width: 767px) {
  .shuimo-seed-control {
    bottom: 8px;
    left: 8px;
    padding: 4px 8px;
    font-size: 11px;
  }
}
</style>
