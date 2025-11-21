# 水墨画卷轴组件说明

## ShuimoScrollPainting.vue

这是一个展示卷轴展开效果并显示动态生成的中国山水画的组件。

### 功能特性

- ✨ **卷轴展开动画**: 左右轴杆从中间向两侧展开,上下连接线同步展开
- 🎨 **动态山水画**: 每次刷新页面都会生成独特的山水画作品
- 🌄 **中国传统美学**: 使用水墨画风格,包含远山、中山、近山、树木、水面等元素
- 🎲 **可重现**: 基于时间戳生成种子,相同种子生成相同画作
- 📜 **传统印章**: 包含仿古印章和题字

### 使用方法

```vue
<template>
  <ShuimoScrollPainting @complete="onAnimationComplete" />
</template>

<script setup>
function onAnimationComplete() {
  console.log('卷轴动画完成')
}
</script>
```

### 事件

#### @complete
卷轴展开动画完成后触发

### 技术实现

#### 生成算法
- **SimplePRNG**: 简化版伪随机数生成器,基于种子生成可重现的随机数
- **SimpleNoise**: 简化版柏林噪声,用于生成自然的山体轮廓
- **SVG路径**: 使用二次贝塞尔曲线生成平滑的山体

#### 画作元素
1. **远山** (最淡): 使用低透明度,位于画面上方
2. **中山** (中等): 中等透明度,位于中间
3. **近山** (最深): 高透明度,位于画面下方
4. **树木**: 随机分布在山坡上,包含树干和树冠
5. **水面**: 3层波纹效果,模拟湖面或江面
6. **印章**: 红色方形印章,包含"墨"字
7. **题字**: 显示"水墨山川"和种子信息

### 动画时序

```
0.0s - 开始展开
├─ 卷轴轴杆从中间向两侧移动 (0-2s)
├─ 上下连接线同步展开 (0-2s)
└─ 画作淡入显示 (0.8-1.6s)
2.0s - 动画完成,触发@complete事件
2.0-4.0s - 整体淡出
```

### 自定义

#### 修改画作尺寸
在 `useShuimoPainting.ts` 中修改 `generatePainting` 函数的参数:

```typescript
svgContent.value = generatePainting(seed, 1200, 800) // 宽度x高度
```

#### 修改种子策略
```typescript
// 固定种子 - 每次都生成相同的画
const seed = 'my-fixed-seed'

// 随机种子 - 每次都不同
const seed = `shuimo-${Date.now()}`

// 从URL获取种子
const seed = new URLSearchParams(window.location.search).get('seed') || `shuimo-${Date.now()}`
```

#### 调整动画时长
```vue
<script setup>
const animationDuration = 3000 // 改为3秒
</script>
```

### 后续改进计划

- [ ] 集成完整的 shuimo-core 模块
- [ ] 添加更多山水元素(亭台楼阁、小船、飞鸟等)
- [ ] 支持配置项(是否显示印章、题字等)
- [ ] 添加下载画作功能
- [ ] 支持画作缓存和分享
- [ ] 季节主题变化(春夏秋冬)

### 注意事项

1. **性能**: 画作生成是同步的,复杂度不高,但在低端设备上可能需要优化
2. **兼容性**: 使用现代SVG特性,需要现代浏览器支持
3. **字体**: 题字使用中文字体,建议确保系统有楷体或宋体
4. **随机性**: 基于伪随机算法,相同种子生成完全相同的画作

### 相关文件

- `ShuimoScrollPainting.vue` - 主组件
- `useShuimoPainting.ts` - 画作生成逻辑
- `../shuimo-core/` - 完整的山水画生成引擎(待集成)
