import { prng } from './p-rng'
/**
 * 柏林噪声生成器，改写为类便于复用与注入种子
 */
export class Noise {
  private readonly PERLIN_YWRAPB = 4
  private readonly PERLIN_YWRAP = 1 << this.PERLIN_YWRAPB
  private readonly PERLIN_ZWRAPB = 8
  private readonly PERLIN_ZWRAP = 1 << this.PERLIN_ZWRAPB
  private readonly PERLIN_SIZE = 4095

  private perlinOctaves = 4
  private perlinAmpFalloff = 0.5
  private perlin: number[] | null = null

  private scaledCosine(i: number): number {
    return 0.5 * (1.0 - Math.cos(i * Math.PI))
  }

  noise(x: number, y = 0, z = 0): number {
    if (this.perlin === null) {
      this.perlin = Array.from({ length: this.PERLIN_SIZE + 1 }, () => prng.random())
    }

    if (x < 0) {
      x = -x
    }
    if (y < 0) {
      y = -y
    }
    if (z < 0) {
      z = -z
    }
    z = -z

    let xi = Math.floor(x)
    let yi = Math.floor(y)
    let zi = Math.floor(z)
    let xf = x - xi
    let yf = y - yi
    let zf = z - zi

    let r = 0
    let ampl = 0.5

    for (let o = 0; o < this.perlinOctaves; o++) {
      let of = xi + (yi << this.PERLIN_YWRAPB) + (zi << this.PERLIN_ZWRAPB)
      const rxf = this.scaledCosine(xf)
      const ryf = this.scaledCosine(yf)

      let n1 = this.perlin[of & this.PERLIN_SIZE]
      n1 += rxf * (this.perlin[(of + 1) & this.PERLIN_SIZE] - n1)
      let n2 = this.perlin[(of + this.PERLIN_YWRAP) & this.PERLIN_SIZE]
      n2 += rxf * (this.perlin[(of + this.PERLIN_YWRAP + 1) & this.PERLIN_SIZE] - n2)
      n1 += ryf * (n2 - n1)

      of += this.PERLIN_ZWRAP
      n2 = this.perlin[of & this.PERLIN_SIZE]
      n2 += rxf * (this.perlin[(of + 1) & this.PERLIN_SIZE] - n2)
      let n3 = this.perlin[(of + this.PERLIN_YWRAP) & this.PERLIN_SIZE]
      n3 += rxf * (this.perlin[(of + this.PERLIN_YWRAP + 1) & this.PERLIN_SIZE] - n3)
      n2 += ryf * (n3 - n2)

      n1 += this.scaledCosine(zf) * (n2 - n1)
      r += n1 * ampl
      ampl *= this.perlinAmpFalloff

      xi <<= 1
      xf *= 2
      yi <<= 1
      yf *= 2
      zi <<= 1
      zf *= 2

      if (xf >= 1.0) {
        xi++
        xf--
      }
      if (yf >= 1.0) {
        yi++
        yf--
      }
      if (zf >= 1.0) {
        zi++
        zf--
      }
    }

    return r
  }

  noiseDetail(lod: number, falloff: number): void {
    if (lod > 0) {
      this.perlinOctaves = lod
    }
    if (falloff > 0) {
      this.perlinAmpFalloff = falloff
    }
  }

  noiseSeed(seed?: number): void {
    const lcg = (() => {
      const m = 4294967296
      const a = 1664525
      const c = 1013904223
      let z: number
      return {
        setSeed(val?: number) {
          z = (val == null ? prng.random() * m : val) >>> 0
        },
        rand() {
          z = (a * z + c) % m
          return z / m
        },
      }
    })()

    lcg.setSeed(seed)
    // this.perlin = new Array(this.PERLIN_SIZE + 1)
    this.perlin = Array.from({ length: this.PERLIN_SIZE + 1 }, () => lcg.rand())
    // for (let i = 0; i < this.PERLIN_SIZE + 1; i++) {
    //   this.perlin[i] = lcg.rand()
    // }
  }
}
