#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workspaceFile = path.resolve(__dirname, '../pnpm-workspace.yaml')
const LOCAL_PATH = '/Users/jiabinbin/myself/github/shuimo-core/packages/core'
const BEGIN = '# <shuimo-core-local-link>'
const END = '# </shuimo-core-local-link>'
const BLOCK = `${BEGIN} managed by scripts/toggle-local-shuimo-core.mjs — 'pnpm dev:reset' to remove
overrides:
  '@jobinjia/shuimo-core': link:${LOCAL_PATH}
${END}`

const mode = process.argv[2]
if (mode !== 'on' && mode !== 'off') {
  console.error('Usage: node scripts/toggle-local-shuimo-core.mjs <on|off>')
  process.exit(1)
}

if (mode === 'on' && !fs.existsSync(LOCAL_PATH)) {
  console.error(`Local shuimo-core not found at ${LOCAL_PATH}`)
  process.exit(1)
}

// Matches a top-level `overrides:` key — either the empty `{}` placeholder
// or a multi-line block whose children are indented. Anchored to start of
// line so we never touch the top-level `catalog:` mapping.
const overridesRegex = /^overrides:[^\S\n]*(?:\{\}\n?|\n(?:[ \t].*\n?)*)/m

const original = fs.readFileSync(workspaceFile, 'utf8')
const blockRegex = new RegExp(`\\n*${BEGIN}[\\s\\S]*?${END}\\n?`, 'g')
// First strip our managed block so the file has at most one `overrides:`.
const stripped = original.replace(blockRegex, '\n').replace(/\n{3,}/g, '\n\n')

let next
if (mode === 'on') {
  if (overridesRegex.test(stripped)) {
    // Replace the existing `overrides:` value (placeholder or multi-line)
    // in-place so we don't introduce a duplicate top-level key.
    next = stripped.replace(overridesRegex, `${BLOCK}\n`)
  }
  else {
    // No existing `overrides:` — insert before `catalog:`. eslint yaml/sort-keys
    // expects `overrides` to precede `catalog` in pnpm-workspace.yaml.
    const match = stripped.match(/^catalog:/m)
    if (!match || match.index === undefined) {
      console.error('Could not find top-level `overrides:` or `catalog:` key in pnpm-workspace.yaml')
      process.exit(1)
    }
    next = `${stripped.slice(0, match.index)}${BLOCK}\n\n${stripped.slice(match.index)}`
  }
}
else {
  // off: leave any existing `overrides:` value alone; only ensure trailing newline.
  next = stripped.endsWith('\n') ? stripped : `${stripped}\n`
}

if (next === original) {
  console.log(`shuimo-core local link: already ${mode}`)
  process.exit(0)
}

fs.writeFileSync(workspaceFile, next)
console.log(`shuimo-core local link: ${mode}`)
