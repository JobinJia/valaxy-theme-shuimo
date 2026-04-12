<script setup lang="ts">
import { useThemeConfig } from '../composables'

const themeConfig = useThemeConfig()

const year = new Date().getFullYear()
</script>

<template>
  <footer class="shuimo-footer">
    <ShuimoBrushLine
      variant="light"
      :length="400"
      :width="1"
      class="shuimo-footer__line"
    />
    <div class="shuimo-footer__content">
      <span>&copy;{{ year }} 落梅听风雪</span>
    </div>
  </footer>
</template>

<style lang="scss" scoped>
.shuimo-footer {
  text-align: center;
  padding: 20px;
  margin-top: 24px;

  &__content {
    font-size: 12px;
    color: var(--sm-ink-light);
    letter-spacing: 1px;
  }

  &__name {
    margin-left: 4px;
  }

  &__sep {
    margin: 0 6px;
    opacity: 0.5;
  }

  a {
    color: var(--sm-accent);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  &__beian {
    margin-top: 4px;
  }
}
</style>
