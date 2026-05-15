<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { refreshSeed } from '../composables'

defineProps<{
  seed: number
}>()

const emit = defineEmits<{
  refresh: []
}>()

const copied = ref(false)

const { t } = useI18n()

async function copySeed(seed: number) {
  try {
    await navigator.clipboard.writeText(String(seed))
    copied.value = true
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
    <span class="shuimo-seed-control__label">{{ t('shuimo.seed.label') }}</span>
    <span class="shuimo-seed-control__value">{{ seed }}</span>
    <button
      type="button"
      class="shuimo-seed-control__btn"
      :class="{ 'shuimo-seed-control__btn--copied': copied }"
      :title="t(copied ? 'shuimo.seed.copied' : 'shuimo.seed.copy')"
      :aria-label="t(copied ? 'shuimo.seed.copied' : 'shuimo.seed.copy')"
      @click="copySeed(seed)"
      @animationend="copied = false"
    >
      {{ copied ? '✓' : '⎘' }}
    </button>
    <button
      type="button"
      class="shuimo-seed-control__btn"
      :title="t('shuimo.seed.refresh')"
      :aria-label="t('shuimo.seed.refresh')"
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

    // 复制成功后跑一个 1.5s 的 dummy 动画，结束触发 animationend
    // 让 vue 把 copied 状态自己清掉，比 setTimeout 更精确（动画时长改了不用同步）
    &--copied {
      animation: shuimo-seed-copied-flash 1.5s linear forwards;
    }
  }
}

@keyframes shuimo-seed-copied-flash {
  0%,
  90% {
    color: var(--sm-accent);
  }
  100% {
    color: var(--sm-ink-medium);
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
