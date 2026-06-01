import { describe, expect, it } from 'vitest'
import { slugToFileName } from './slugToFileName'

describe('slugToFileName', () => {
  it('strips leading/trailing slashes and joins with dashes', () => {
    expect(slugToFileName('/posts/hello')).toBe('posts-hello')
    expect(slugToFileName('/posts/hello/')).toBe('posts-hello')
    expect(slugToFileName('/')).toBe('index')
    expect(slugToFileName('')).toBe('index')
  })
})
