// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    unocss: true,
    formatters: true,
  },
  {
    ignores: [
      '**/*/.valaxy',
      'docs/**',
    ],
  },
  {
    files: ['demo/**/*.md'],
    rules: {
      'markdown/require-alt-text': 'off',
    },
  },
)
