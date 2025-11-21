/**
 * 将噪声序列首尾衔接并归一化，便于生成闭合形状
 */
export function loopNoise(nslist: number[]): void {
  const dif = nslist[nslist.length - 1] - nslist[0]
  const bds: [number, number] = [100, -100]

  for (let i = 0; i < nslist.length; i++) {
    nslist[i] += (dif * (nslist.length - 1 - i)) / (nslist.length - 1)
    if (nslist[i] < bds[0])
      bds[0] = nslist[i]
    if (nslist[i] > bds[1])
      bds[1] = nslist[i]
  }

  for (let i = 0; i < nslist.length; i++) {
    nslist[i] = (nslist[i] - bds[0]) / (bds[1] - bds[0])
  }
}
