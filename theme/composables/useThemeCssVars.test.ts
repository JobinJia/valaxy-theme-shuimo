import type { ThemeConfig } from '../types'
import { describe, expect, it } from 'vitest'
import { buildThemeCssVars } from './useThemeCssVars'

function makeConfig(patch: Partial<ThemeConfig>): Partial<ThemeConfig> {
  return patch
}

describe('buildThemeCssVars', () => {
  it('returns a default font stack when config is empty', () => {
    const vars = buildThemeCssVars(null)
    expect(vars['--va-font-family-base']).toContain('Noto Serif SC')
    expect(vars['--sm-c-brand']).toBeUndefined()
  })

  it('injects brand color and alpha overlays when primary is valid hex', () => {
    const vars = buildThemeCssVars(makeConfig({ colors: { primary: '#FF00AA', stamp: '#D4A017' } }))
    expect(vars['--sm-c-brand']).toBe('#FF00AA')
    expect(vars['--sm-c-stamp']).toBe('#D4A017')
    expect(vars['--sm-primary-faint']).toBe('rgba(255, 0, 170, 0.1)')
    expect(vars['--sm-primary-light']).toBe('rgba(255, 0, 170, 0.15)')
    expect(vars['--sm-primary-medium']).toBe('rgba(255, 0, 170, 0.3)')
  })

  it('derives a dark-mode accent by lightening 35% toward white', () => {
    const vars = buildThemeCssVars(makeConfig({ colors: { primary: '#8B4513', stamp: '#C8102E' } }))
    // #8B4513 (139,69,19) + (255-c)*0.35 → (180,134,102) → #B48666
    expect(vars['--sm-c-brand-dark']).toBe('#b48666')
    expect(vars['--sm-primary-faint-dark']).toBe('rgba(180, 134, 102, 0.15)')
    expect(vars['--sm-primary-light-dark']).toBe('rgba(180, 134, 102, 0.22)')
    expect(vars['--sm-primary-medium-dark']).toBe('rgba(180, 134, 102, 0.4)')
  })

  it('skips alpha overlays when primary is not a valid hex', () => {
    const vars = buildThemeCssVars(makeConfig({ colors: { primary: 'notacolor', stamp: '#C8102E' } }))
    expect(vars['--sm-c-brand']).toBe('notacolor')
    expect(vars['--sm-primary-faint']).toBeUndefined()
    expect(vars['--sm-c-brand-dark']).toBeUndefined()
  })

  it('prefers fonts.body over fonts.serif for the base family', () => {
    const vars = buildThemeCssVars(makeConfig({ fonts: { body: 'BodyFont', serif: 'SerifFont' } }))
    expect(vars['--va-font-family-base']).toBe('BodyFont')
  })

  it('falls back to fonts.serif when body is missing', () => {
    const vars = buildThemeCssVars(makeConfig({ fonts: { serif: 'SerifFont' } }))
    expect(vars['--va-font-family-base']).toBe('SerifFont')
  })

  it('injects --sm-font-title only when fonts.title is set', () => {
    expect(buildThemeCssVars(makeConfig({ fonts: { title: 'YiShan' } }))['--sm-font-title']).toBe('YiShan')
    expect(buildThemeCssVars(makeConfig({ fonts: {} }))['--sm-font-title']).toBeUndefined()
  })
})
