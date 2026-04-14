<script setup lang="ts">
import { computed } from 'vue'
import { useThemeConfig } from '../composables'

const themeConfig = useThemeConfig()

const year = new Date().getFullYear()
const powered = computed(() => themeConfig.value?.footer?.powered !== false)
const beian = computed(() => themeConfig.value?.footer?.beian)
const siteName = computed(() => themeConfig.value?.header?.title || '')
</script>

<template>
  <footer class="shuimo-footer">
    <div class="shuimo-footer__content">
      <span>&copy;{{ year }}</span>
      <span v-if="siteName"> {{ siteName }}</span>
    </div>
    <div v-if="powered" class="shuimo-footer__powered">
      Powered by <a href="https://valaxy.site/" target="_blank">Valaxy</a>
      · Theme <a href="https://github.com/JobinJia/valaxy-theme-shuimo1" target="_blank">Shuimo</a>
    </div>
    <div v-if="beian?.enable && beian?.icp" class="shuimo-footer__beian">
      <a href="https://beian.miit.gov.cn/" target="_blank">{{ beian.icp }}</a>
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

  &__powered {
    font-size: 11px;
    color: var(--sm-ink-light);
    margin-top: 6px;
    opacity: 0.7;
  }

  a {
    color: var(--sm-accent);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  &__beian {
    margin-top: 6px;
    font-size: 11px;
  }
}
</style>
