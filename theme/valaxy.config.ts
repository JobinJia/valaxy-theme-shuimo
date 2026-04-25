import type { ThemeConfig } from './types'
import { defineTheme } from 'valaxy'
import { buildShuimoFontSubsetPlugin, defaultThemeConfig, generateSafelist, themePlugin } from './node'
import { applyPreset } from './node/presets'

export default defineTheme<ThemeConfig>((options) => {
  const userThemeConfig = (options.config.themeConfig || {}) as Partial<ThemeConfig>
  const effectiveThemeConfig = applyPreset(defaultThemeConfig, userThemeConfig)

  const fontSubsetPlugin = buildShuimoFontSubsetPlugin(options)

  return {
    themeConfig: effectiveThemeConfig,
    vite: {
      plugins: [
        themePlugin(options),
        ...(fontSubsetPlugin ? [fontSubsetPlugin] : []),
      ],
    },
    unocss: {
      safelist: generateSafelist(effectiveThemeConfig),
    },
  }
})
