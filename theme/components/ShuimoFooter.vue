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
      <span v-if="themeConfig?.footer?.since">
        &copy; {{ themeConfig.footer.since }}-{{ year }}
      </span>
      <span v-else>
        &copy; {{ year }}
      </span>

      <span v-if="themeConfig?.header?.title" class="shuimo-footer__name">
        {{ themeConfig.header.title }}
      </span>

      <template v-if="themeConfig?.footer?.powered !== false">
        <span class="shuimo-footer__sep">&middot;</span>
        <span>
          Powered by
          <a href="https://valaxy.site" target="_blank" rel="noopener noreferrer">Valaxy</a>
        </span>
        <span class="shuimo-footer__sep">&middot;</span>
        <span>Theme Shuimo</span>
      </template>

      <div
        v-if="themeConfig?.footer?.beian?.enable"
        class="shuimo-footer__beian"
      >
        <a
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ themeConfig.footer.beian.icp }}
        </a>
      </div>
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
