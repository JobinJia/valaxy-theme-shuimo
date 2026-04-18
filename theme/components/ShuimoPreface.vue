<script setup lang="ts">
defineProps<{
  quote: string
  source?: string
}>()
</script>

<template>
  <div class="shuimo-preface">
    <div class="shuimo-preface__body">
      <span class="shuimo-preface__mark shuimo-preface__mark--open">「</span>
      <p class="shuimo-preface__quote">
        {{ quote }}
      </p>
      <span class="shuimo-preface__mark shuimo-preface__mark--close">」</span>
    </div>
    <p v-if="source" class="shuimo-preface__source">
      {{ source }}
    </p>
  </div>
</template>

<style lang="scss" scoped>
.shuimo-preface {
  max-width: 480px;
  margin: 0 auto;
  padding: 24px 20px 16px;
  text-align: center;

  &__body {
    position: relative;
    padding: 0 28px;
  }

  &__mark {
    position: absolute;
    font-size: 32px;
    color: var(--sm-primary-medium, rgba(139, 69, 19, 0.3));
    font-family: var(--sm-font-kai);
    line-height: 1;
    user-select: none;

    &--open {
      top: -6px;
      left: 0;
    }

    &--close {
      bottom: -6px;
      right: 0;
    }
  }

  &__quote {
    font-size: 15px;
    color: var(--sm-ink-medium);
    font-family: var(--sm-font-kai);
    line-height: 2;
    letter-spacing: 1px;
    margin: 0;
    text-indent: 0;
  }

  &__source {
    font-size: 12px;
    color: var(--sm-ink-light);
    margin: 10px 0 0;
    letter-spacing: 1px;
    font-family: var(--sm-font-kai);
  }
}
</style>
