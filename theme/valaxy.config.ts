import type { ThemeConfig, ThemePreset } from './types'
import { defineTheme } from 'valaxy'
import { defaultThemeConfig, generateSafelist, themePlugin } from './node'
import { themePresets } from './node/presets'

function deepMerge<T extends Record<string, any>>(target: T, source: Record<string, any>): T {
  const result = { ...target }
  for (const key of Object.keys(source)) {
    const sv = source[key]
    const tv = (target as any)[key]
    if (sv && typeof sv === 'object' && !Array.isArray(sv) && tv && typeof tv === 'object' && !Array.isArray(tv))
      (result as any)[key] = deepMerge(tv, sv)
    else
      (result as any)[key] = sv
  }
  return result
}

export default defineTheme<ThemeConfig>((options) => {
  const userPreset = (options.config.themeConfig as Partial<ThemeConfig>)?.preset as ThemePreset | undefined
  const presetOverrides = userPreset && themePresets[userPreset] ? themePresets[userPreset] : {}
  const effectiveDefault = deepMerge(defaultThemeConfig, presetOverrides as Record<string, any>)

  return {
    themeConfig: effectiveDefault,
    vite: {
      plugins: [themePlugin(options)],
    },
    unocss: {
      safelist: generateSafelist(options.config.themeConfig as ThemeConfig),
    },
  }
})
