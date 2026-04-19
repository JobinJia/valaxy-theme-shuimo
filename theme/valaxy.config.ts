import type { ThemeConfig } from './types'
import { defineTheme } from 'valaxy'
import { defaultThemeConfig, generateSafelist, themePlugin } from './node'
import { applyPreset } from './node/presets'

export default defineTheme<ThemeConfig>((options) => {
  const userThemeConfig = (options.config.themeConfig || {}) as Partial<ThemeConfig>
  const effectiveThemeConfig = applyPreset(defaultThemeConfig, userThemeConfig)

  return {
    themeConfig: effectiveThemeConfig,
    vite: {
      plugins: [themePlugin(options)],
    },
    unocss: {
      safelist: generateSafelist(effectiveThemeConfig),
    },
  }
})
