/**
 * Shan-Shui (Mountain-Water) Painting Generator
 *
 * Refactored to use shuimo-core modules
 *
 * Based on the original algorithm by Lingdong Huang
 * Reference: https://github.com/LingDong-/shan-shui-inf
 */

import { Arch, Mount, noise, Planner, prng } from 'shuimo-core'

// Hijack Math.random to use shuimo-core's PRNG
const originalRandom = Math.random
Math.random = () => prng.next()

/**
 * Main painting generation function
 */
export function useShanShuiPainting() {
  function generate(seed: string | number, width: number = 1000, height: number = 500, paperTextureDataUrl?: string): string {
    // Initialize random seed
    const numericSeed = typeof seed === 'string' ? seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : seed
    prng.seed(numericSeed)

    const elements: string[] = []

    // Generate plan using Planner
    // We generate a plan for the whole width plus some padding
    // In shanshui.html, it generates chunks. Here we generate one big chunk for simplicity for now.
    // If infinite scrolling is needed later, we'd need a different approach.
    const plan = Planner.mountplanner(0, width + 200, numericSeed)

    for (let i = 0; i < plan.length; i++) {
      const item = plan[i]
      if (item.tag === 'mount') {
        elements.push(Mount.mountain(item.x, item.y, i * 2 * Math.random()))
        // elements.push(water(item.x, item.y, i * 2))
      }
      else if (item.tag === 'flatmount') {
        elements.push(Mount.flatMount(item.x, item.y, 2 * Math.random() * Math.PI, {
          wid: 600 + Math.random() * 400,
          hei: 100,
          cho: 0.5 + Math.random() * 0.2,
        }))
      }
      else if (item.tag === 'distmount') {
        elements.push(Mount.distMount(item.x, item.y, Math.random() * 100, {
          hei: 150,
          len: [500, 1000, 1500][Math.floor(Math.random() * 3)],
        }))
      }
      else if (item.tag === 'boat') {
        elements.push(Arch.boat(item.x, item.y, Math.random(), {
          sca: item.y / 800,
          fli: Math.random() > 0.5,
        }))
      }
    }

    // Calculate responsive padding (approximately 10px equivalent at 1100px width)
    const paddingRatio = 10 / 1100 // ~0.9% padding
    const hPadding = width * paddingRatio
    const vPadding = height * paddingRatio

    const svgContent = `
      <svg viewBox="0 0 ${width} ${height}" overflow="hidden" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          ${paperTextureDataUrl
            ? `
          <pattern id="paperTexture" patternUnits="userSpaceOnUse" width="128" height="128">
            <image href="${paperTextureDataUrl}" width="128" height="128" />
          </pattern>
          `
            : ''}
        </defs>
        <rect width="100%" height="100%" fill="${paperTextureDataUrl ? 'url(#paperTexture)' : 'rgb(245, 232, 207)'}" />
        <g transform="translate(${hPadding}, ${vPadding})">
          <svg width="${width - 2 * hPadding}" height="${height - 2 * vPadding}" viewBox="0 0 ${width - 2 * hPadding} ${height - 2 * vPadding}" overflow="visible">
          ${elements.join('\n')}
          </svg>
        </g>
      </svg>
    `

    return svgContent
  }

  /**
   * Generate paper texture data URL
   * @param width Width of the texture
   * @param height Height of the texture
   */
  function generatePaperTexture(width: number = 128, height: number = 128): string {
    // Create a temporary canvas
    // Note: In a Node.js environment (SSG), this might fail if not handled.
    // But this is a client-side composable, so it should be fine.
    if (typeof document === 'undefined')
      return ''

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx)
      return ''

    for (let i = 0; i < width / 2 + 1; i++) {
      for (let j = 0; j < height / 2 + 1; j++) {
        // Original logic: var c = 245 + Noise.noise(i * 0.1, j * 0.1) * 10
        // shuimo-core noise might have different scaling, but let's try to match
        let c = 245 + noise.noise(i * 0.1, j * 0.1) * 10
        c -= Math.random() * 20

        const r = c.toFixed(0)
        const g = (c * 0.95).toFixed(0)
        const b = (c * 0.85).toFixed(0)
        ctx.fillStyle = `rgb(${r},${g},${b})`
        ctx.fillRect(i, j, 1, 1)
        ctx.fillRect(width - i, j, 1, 1)
        ctx.fillRect(i, height - j, 1, 1)
        ctx.fillRect(width - i, height - j, 1, 1)
      }
    }
    return canvas.toDataURL('image/png')
  }

  // Cleanup function
  function cleanup() {
    Math.random = originalRandom
  }

  return {
    generate,
    generatePaperTexture,
    cleanup,
  }
}
