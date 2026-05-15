<script setup lang="ts">
import type { Ref } from 'vue'
import { inject, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { rafDebounce } from '../composables/useRafDebounce'

const { t } = useI18n()
const visible = ref(false)
const scrollContainer = inject<Ref<HTMLElement | null>>('scrollContainer', ref(null))

function getTarget(): HTMLElement | Window {
  return scrollContainer.value || window
}

function getScrollTop(): number {
  const t = scrollContainer.value
  return t ? t.scrollTop : window.scrollY
}

// rAF 节流：scroll 事件原生 ~60-120Hz，每次都读 scrollTop 触发 layout flush。
// 合并到下一帧只读一次；ref 自带相等性 dedupe，反复写同状态无 reactivity 成本
const updateVisible = rafDebounce(() => {
  visible.value = getScrollTop() > 200
})

function scrollToTop() {
  const t = scrollContainer.value
  if (t)
    t.scrollTo({ top: 0, behavior: 'smooth' })
  else
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  getTarget().addEventListener('scroll', updateVisible.schedule, { passive: true })
  updateVisible.schedule()
})

onBeforeUnmount(() => {
  getTarget().removeEventListener('scroll', updateVisible.schedule)
  updateVisible.cancel()
})
</script>

<template>
  <Transition name="fade">
    <button
      v-if="visible"
      type="button"
      class="shuimo-helper"
      :title="t('shuimo.back_to_top')"
      :aria-label="t('shuimo.back_to_top')"
      @click="scrollToTop"
    >
      <span class="shuimo-helper__icon">↑</span>
    </button>
  </Transition>
</template>

<style lang="scss" scoped>
.shuimo-helper {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 40px;
  height: 40px;
  border: 1px solid var(--sm-c-border-medium);
  background: var(--sm-paper);
  color: var(--sm-ink-medium);
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 200;
  font-family: var(--va-font-family-base);

  &:hover {
    color: var(--sm-ink-dark);
    border-color: var(--sm-ink-medium);
  }

  &__icon {
    font-size: 16px;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 767px) {
  .shuimo-helper {
    right: 12px;
    bottom: 12px;
    width: 36px;
    height: 36px;
  }
}
</style>
