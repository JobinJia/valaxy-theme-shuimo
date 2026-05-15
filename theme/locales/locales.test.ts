import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))

function extractKeyPaths(yamlSource: string): Set<string> {
  // 简易缩进式 YAML 扫描：只识别 `key:` 与 `key: value`，足以覆盖本仓 locale 形态。
  // 不处理数组、不处理多行字符串——若未来引入这些形态需切到 js-yaml。
  const stack: { indent: number, key: string }[] = []
  const leaves = new Set<string>()
  for (const raw of yamlSource.split('\n')) {
    if (!raw.trim() || raw.trim().startsWith('#'))
      continue
    const indent = raw.match(/^( *)/)?.[1].length ?? 0
    const m = raw.match(/^ *([^:#\s][^:#]*?):\s*(.*?)\s*$/)
    if (!m)
      continue
    const key = m[1]
    const value = m[2]
    while (stack.length && stack[stack.length - 1].indent >= indent)
      stack.pop()
    stack.push({ indent, key })
    if (value !== '')
      leaves.add(stack.map(s => s.key).join('.'))
  }
  return leaves
}

describe('locale key parity', () => {
  const zh = readFileSync(join(here, 'zh-CN.yml'), 'utf8')
  const en = readFileSync(join(here, 'en.yml'), 'utf8')

  it('every leaf key in zh-CN.yml exists in en.yml', () => {
    const zhKeys = extractKeyPaths(zh)
    const enKeys = extractKeyPaths(en)
    const missing = [...zhKeys].filter(k => !enKeys.has(k))
    expect(missing).toEqual([])
  })

  it('every leaf key in en.yml exists in zh-CN.yml', () => {
    const zhKeys = extractKeyPaths(zh)
    const enKeys = extractKeyPaths(en)
    const missing = [...enKeys].filter(k => !zhKeys.has(k))
    expect(missing).toEqual([])
  })
})
