/**
 * 水墨画生成 Composable
 * 使用 shuimo-core 的山水画生成逻辑
 */

// 直接从 useShanShuiPainting 导入完整实现
import { useShanShuiPainting } from './useShanShuiPainting'

export function useShuimoPainting() {
  const { generate: generateSVG, generatePaperTexture: generateTexture, cleanup: cleanupRandom } = useShanShuiPainting()

  return {
    /**
     * 生成山水画 SVG
     * @param seed - 随机种子（数字）
     * @param width - 画布宽度
     * @param height - 画布高度
     */
    generate(seed: number, width: number, height: number, paperTextureDataUrl?: string): string {
      return generateSVG(`shuimo-${seed}`, width, height, paperTextureDataUrl)
    },

    /**
     * 生成纸张纹理
     * @param width 宽度
     * @param height 高度
     */
    generatePaperTexture(width: number, height: number): string {
      return generateTexture(width, height)
    },

    /**
     * 清理资源
     */
    cleanup() {
      cleanupRandom()
    },
  }
}
