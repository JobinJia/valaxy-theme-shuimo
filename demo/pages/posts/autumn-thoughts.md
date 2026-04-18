---
title: 秋日偶得
date: 2024-09-08
categories: 技术
series: 水墨技术笔记
seriesOrder: 3
tags:
  - Vue
  - 前端
stamp:
  text: 秋
  color: '#B8860B'
---

空山新雨后，天气晚来秋。明月松间照，清泉石上流。

<!-- more -->

## 落叶与重构

秋天是收获的季节，也是整理的时候。代码库亦如此——经过一个夏天的快速生长，是时候修剪枝叶、梳理脉络了。

重构不是推倒重来，而是顺着代码本来的纹理，去掉多余的枝丫，让主干更清晰。就像秋风扫落叶，留下的是更坚韧的骨架。

## 组件化的哲学

```vue
<template>
  <Mountain :height="peaks" :texture="ink">
    <Tree v-for="t in forest" :key="t.id" v-bind="t" />
  </Mountain>
</template>
```

一山一树，各司其职。组件化的精髓在于「分而治之」——每个组件只做一件事，做到极致。

## 晚来风急

竹喧归浣女，莲动下渔舟。随意春芳歇，王孙自可留。
