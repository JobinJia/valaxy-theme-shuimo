import { prng } from './p-rng.js'
import { Noise } from './perlin-noise.js'
import { polyTools } from './poly-tools.js'
import { utilTools } from './util.js'
import { uiTools } from './render/ui/index.js'
import { downloader } from './downloader.js'
import { poly } from './render/poly.js'

/**
 * 在浏览器中注入与旧版脚本同名的全局对象/方法
 */
export function setupShuimoCoreGlobals(): void {
  const g = globalThis as any

  // 噪声与随机
  const noiseInstance = new Noise()
  g.Prng = prng
  g.Noise = noiseInstance
  g.Math.random = () => prng.next()
  g.Math.seed = (x?: number) => prng.seed(x)

  // Poly 工具
  g.PolyTools = polyTools

  // 基础工具函数
  g.unNan = utilTools.unNan.bind(utilTools)
  g.distance = utilTools.distance.bind(utilTools)
  g.mapval = utilTools.mapVal.bind(utilTools)
  g.loopNoise = utilTools.loopNoise.bind(utilTools)
  g.randChoice = utilTools.randChoice.bind(utilTools)
  g.normRand = utilTools.normRand.bind(utilTools)
  g.wtrand = utilTools.wtrand.bind(utilTools)
  g.randGaussian = utilTools.randGaussian.bind(utilTools)
  g.bezmh = utilTools.bezmh.bind(utilTools)
  g.poly = poly

  // UI 交互工具，依赖全局 MEM/update/viewupdate
  const deps = () => {
    const { MEM, needupdate, update, viewupdate } = g
    return { MEM, needupdate, update, viewupdate }
  }
  g.xcroll = (v: number) => uiTools.xcroll(v, deps())
  g.autoxcroll = (v: number) => uiTools.autoxcroll(v, deps())
  g.rstyle = (id: string, dim: boolean) => uiTools.rstyle(id, g?.MEM?.windy ?? 0, dim)
  g.toggleVisible = (id: string) => uiTools.toggleVisible(id)
  g.toggleText = (id: string, a: string, b: string) => uiTools.toggleText(id, a, b)
  g.present = () => uiTools.present()
  g.reloadWSeed = (s: string) => uiTools.reloadWithSeed(s)
  g.btnHoverCol = 'rgba(0,0,0,0.1)'

  // 下载工具
  g.download = (filename: string, text: string) => downloader.download(filename, text)
}
