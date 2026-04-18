---
title: 春雨润笔端
date: 2025-03-22
categories: 技术
series: 水墨技术笔记
seriesOrder: 2
tags:
  - Canvas
  - 水墨
stamp:
  text: 润,无声
---

好雨知时节，当春乃发生。随风潜入夜，润物细无声。

<!-- more -->

## 雨中写生

春雨绵绵，正是画水墨的好时节。Canvas 是现代的宣纸，JavaScript 是数字时代的毛笔。

用程序画一幅山水，与古人持笔挥毫，本质上并无不同——都是将胸中丘壑，化为眼前山水。

## 笔触算法

```typescript
// 一笔之中，起承转合
function brushStroke(points: Point[], pressure: number[]) {
  for (let i = 0; i < points.length; i++) {
    const width = pressure[i] * maxWidth
    const noise = perlin(i * 0.1) * jitter
    drawSegment(points[i], width + noise)
  }
}
```

毛笔的飞白、洇墨、枯笔，都可以用噪声函数来模拟。Perlin noise 赋予笔触生命，让每一笔都独一无二。

## 雨歇

晓看红湿处，花重锦官城。

春雨过后，代码也该收笔了。`git commit -m "春雨一场，润了笔端"`。
