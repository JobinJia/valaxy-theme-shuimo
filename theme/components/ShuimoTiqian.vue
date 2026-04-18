<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  subtitle?: string
  vertical?: boolean
}>(), {
  vertical: false,
})
</script>

<template>
  <div
    class="shuimo-tiqian"
    :class="{ 'shuimo-tiqian--vertical': vertical }"
  >
    <div class="shuimo-tiqian__inner">
      <h2 class="shuimo-tiqian__title">
        {{ title }}
      </h2>
      <span v-if="subtitle" class="shuimo-tiqian__subtitle">
        {{ subtitle }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.shuimo-tiqian {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &__inner {
    position: relative;
    padding: 10px 24px;
    border: 1px solid var(--sm-c-border-medium, rgba(0, 0, 0, 0.12));
    border-radius: 2px;
    background: var(--sm-card-bg);
    text-align: center;

    // Double-line border effect
    &::before {
      content: '';
      position: absolute;
      inset: 3px;
      border: 1px solid var(--sm-c-border, rgba(0, 0, 0, 0.06));
      border-radius: 1px;
      pointer-events: none;
    }
  }

  &__title {
    font-size: 18px;
    font-weight: bold;
    color: var(--sm-ink-dark);
    letter-spacing: 6px;
    margin: 0;
    font-family: var(--sm-font-kai);
    line-height: 1.4;
  }

  &__subtitle {
    display: block;
    font-size: 12px;
    color: var(--sm-ink-light);
    letter-spacing: 2px;
    margin-top: 4px;
    font-family: var(--sm-font-kai);
  }

  // Vertical text mode
  &--vertical {
    .shuimo-tiqian__inner {
      padding: 20px 14px;
    }

    .shuimo-tiqian__title {
      writing-mode: vertical-rl;
      letter-spacing: 8px;
      font-size: 20px;
    }

    .shuimo-tiqian__subtitle {
      writing-mode: vertical-rl;
      letter-spacing: 3px;
      margin-top: 0;
      margin-right: 6px;
    }
  }
}
</style>
