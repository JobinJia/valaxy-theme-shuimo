<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{
  /** Display string like "重庆" or "N29.56° E106.55°". */
  locationLabel: string
  /** Already-formatted dynamic label like "月相：望" or "节气：谷雨". */
  dynamicLabel: string
  /** Chinese shichen character, e.g. "子". */
  shichen: string
  /** Whether to show the toggle button. Usually `astronomy.allowVisitorOverride`. */
  showToggle: boolean
  /** True if currently overridden to visitor location. */
  isVisitorOverride: boolean
  /** Transient message (null when none). */
  message: string | null
}>()

defineEmits<{
  toggle: []
}>()

const { t } = useI18n()
</script>

<template>
  <div class="shuimo-celestial-pill">
    <span class="shuimo-celestial-pill__loc">{{ locationLabel }}</span>
    <span class="shuimo-celestial-pill__sep">·</span>
    <span class="shuimo-celestial-pill__dyn">{{ dynamicLabel }}</span>
    <span class="shuimo-celestial-pill__sep">·</span>
    <span class="shuimo-celestial-pill__shichen">{{ shichen }}时</span>
    <button
      v-if="showToggle"
      class="shuimo-celestial-pill__btn"
      type="button"
      @click="$emit('toggle')"
    >
      {{ isVisitorOverride ? t('shuimo.astronomy.restore_blogger_view') : t('shuimo.astronomy.switch_to_my_location') }}
    </button>
    <span v-if="message" class="shuimo-celestial-pill__msg">{{ message }}</span>
  </div>
</template>

<style lang="scss" scoped>
.shuimo-celestial-pill {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translate(-50%, 8px);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  font-family: var(--sm-font-kai);
  font-size: 11px;
  color: var(--sm-ink-light);
  background: rgba(0, 0, 0, 0.25);
  border-radius: 999px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.3s ease 0.15s;
  pointer-events: none;

  &__btn {
    background: none;
    border: 1px solid rgba(255, 255, 255, 0.25);
    color: inherit;
    border-radius: 999px;
    padding: 1px 6px;
    cursor: pointer;
    font-size: inherit;
    font-family: inherit;
  }

  &__msg {
    color: var(--sm-accent, #c8102e);
  }
}
</style>
