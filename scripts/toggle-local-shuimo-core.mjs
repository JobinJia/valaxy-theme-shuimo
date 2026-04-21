#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
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

const original = fs.readFileSync(workspaceFile, 'utf8')
const blockRegex = new RegExp(`\\n*${BEGIN}[\\s\\S]*?${END}\\n?`, 'g')
const stripped = original.replace(blockRegex, '\n').replace(/\n{3,}/g, '\n\n')

const next = mode === 'on'
  ? `${stripped.trimEnd()}\n\n${BLOCK}\n`
  : (stripped.endsWith('\n') ? stripped : `${stripped}\n`)

if (next === original) {
  console.log(`shuimo-core local link: already ${mode}`)
  process.exit(0)
}

fs.writeFileSync(workspaceFile, next)
console.log(`shuimo-core local link: ${mode}`)
