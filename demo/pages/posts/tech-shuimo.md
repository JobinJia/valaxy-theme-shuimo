---
title: 使用 Canvas 绘制水墨笔触
date: 2024-03-10
updated: 2024-06-15
categories: 技术
original: true
tags:
  - Canvas
  - Vue
  - 水墨
stamp:
  text: 水墨
---

如何用 HTML Canvas 模拟传统毛笔的压力变化与飞白效果？

<!-- more -->

## 笔触模型

传统毛笔笔触由三个阶段组成：

1. **起笔**：笔尖接触纸面，压力逐渐增大
2. **行笔**：稳定运笔，墨色均匀
3. **收笔**：提笔离纸，产生飞白效果

## 实现思路

通过贝塞尔曲线模拟笔迹轨迹，再根据压力函数调整线宽：

```typescript
function pressure(t: number): number {
  if (t < 0.2) return t / 0.2 // 起笔
  if (t > 0.8) return (1 - t) / 0.2 * 0.4 // 收笔
  return 1 // 行笔
}
```

## 飞白效果

飞白是中国书法中特有的效果，笔画中出现的枯笔留白。通过在笔触末端降低墨色浓度和增加随机间隙来模拟。

![毛笔笔触的三个阶段示意](https://picsum.photos/seed/brush/600/300)

水墨之美，在于不完美。

![飞白效果的数字模拟](https://picsum.photos/seed/feibai/600/300)
