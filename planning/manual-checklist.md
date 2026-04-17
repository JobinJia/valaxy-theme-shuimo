# 人工验证对照表

> 基准配置文件：`demo/valaxy.config.ts`  
> 目标：按当前 demo 配置逐项确认 `P0-1` 已兑现的配置项确实生效。

## 使用方式

1. 运行 `pnpm dev`
2. 打开本地 demo
3. 按下面页面逐项检查
4. 符合预期就勾选

---

## A. 当前 demo 基准配置

- `colors.primary = '#FF00AA'`
- `colors.stamp = '#D4A017'`
- `fonts.serif = '"Songti SC", "Noto Serif SC", serif'`
- `fonts.body = '"PingFang SC", "Noto Serif SC", serif'`
- `fonts.title = 'YiShanBeiZhuan'`
- `footer.since = 2020`
- `footer.beian.enable = true`
- `footer.beian.icp = '沪ICP备20260000号-1'`
- `sidebar.author.stamp = '听雨'`
- `stamp.author = '隔窗,听雨'`
- `stamp.shape = 'ellipse'`
- `nav[0].icon = 'i-ant-design-book-outlined'`
- `nav[1].icon = 'i-ant-design-user-outlined'`
- `decorations.enable = true`
- `decorations.seasonAware = false`
- `decorations.heroLandscape = true`
- `decorations.curtainColor = '#1F2937'`
- `decorations.opacity = 0.22`
- `xuanPaper.enable = true`
- `xuanPaper.variant = 'gold'`
- `brushStrokes.enable = true`

---

## B. 首页验证

- [ ] 首页能看到山水背景，说明 `decorations.heroLandscape = true` 生效
- [ ] 首页进入时仍有幕布展开效果，说明山水开关已接入动画链路
- [ ] 幕布颜色应为深灰蓝色 `#1F2937`，而不是默认纸色，说明 `decorations.curtainColor` 生效
- [ ] 首页站名“落梅听雪阁”使用标题字体，视觉应比正文更有篆书感
- [ ] 首页导航“栖墨斋 / 暗香阁”前面能看到图标
- [ ] 首页导航文字与 hover 强调色偏洋红色 `#FF00AA`，而不是默认棕色，说明 `colors.primary` 生效
- [ ] 首页大印章不是圆章，而是椭圆印章，说明 `stamp.shape = 'ellipse'` 生效
- [ ] 首页大印章颜色偏金黄色 `#D4A017`，而不是默认朱红，说明 `colors.stamp` 生效

## C. 关于页验证

- [ ] 关于页顶部能看到“主题色测试块”，里面有 4 个色块
- [ ] 其中 `--sm-accent` 色块应为洋红色 `#FF00AA`
- [ ] 其中 `--sm-stamp` 色块应为金黄色 `#D4A017`
- [ ] `--sm-primary-light` 与 `--sm-primary-medium` 应是同一主题色的浅/深透明版本
- [ ] 关于页背景有宣纸纹理，不是纯平背景，说明 `xuanPaper.enable = true` 生效
- [ ] 宣纸整体偏金色暖调，说明 `xuanPaper.variant = 'gold'` 生效
- [ ] 页面标题与印章使用标题字体/印章风格，和首页保持一致
- [ ] 页面正文比标题更像系统正文字体，说明 `fonts.body` 已接入基础文本
- [ ] 页面下方印章为椭圆形，不是圆形或方形

## D. 归档页验证

- [ ] 归档页背景也有宣纸纹理，说明默认布局已接入 `ShuimoXuanPaper`
- [ ] 归档页标题字体与首页标题风格一致
- [ ] 时间轴圆点、交互强调色应偏洋红色 `#FF00AA`，说明 `colors.primary` 生效

## E. 分类/标签页验证

- [ ] 分类页与标签页背景有宣纸纹理
- [ ] 分类标签项 hover 时强调色偏洋红色 `#FF00AA`
- [ ] 页面标题仍使用标题字体

## F. 侧边栏与文章页验证

- [ ] 文章详情页或带侧边栏页面里，侧边栏印章文案优先显示“听雨”，而不是“隔窗,听雨”或作者名
- [ ] 侧边栏印章形状为椭圆
- [ ] 文章落款印章也是椭圆
- [ ] 文章正文基础字体与标题字体有明显区分

## G. 页脚验证

- [ ] 页脚版权年份显示为 `©2020-当前年` 的区间格式，而不是单独当前年
- [ ] 页脚仍显示 Powered by Valaxy
- [ ] 页脚显示备案号 `沪ICP备20260000号-1`

## H. 404 页面验证

> 手动访问一个不存在的地址，例如 `/not-found-check`

- [ ] 404 页面左下角有装饰元素，说明 `decorations.enable = true` 生效
- [ ] 装饰透明度比非常淡的背景更明显，说明 `decorations.opacity = 0.22` 已接入
- [ ] 由于 `decorations.seasonAware = false`，装饰应固定为 `plum` 风格，不应随季节变化

## I. 笔触验证

- [ ] 首页标题下方的笔触分隔线存在
- [ ] 页面中的毛笔线条、印章周边风格仍正常，没有退化成纯直线 UI
- [ ] Markdown 中的分隔线/标题装饰保持水墨笔触感，说明 `brushStrokes.enable = true` 没被破坏

---

## J. 可选切换验证

> 下面不是当前基准状态，而是你可以临时修改 `demo/valaxy.config.ts` 再验证一次。

### 1. 关闭首页山水

临时改：

```ts
decorations: {
  enable: true,
  seasonAware: false,
  heroLandscape: false,
  opacity: 0.22,
},
```

预期：

- [ ] 首页山水背景消失
- [ ] 首页幕布动画消失
- [ ] 页面内容仍正常显示

### 2. 关闭宣纸

临时改：

```ts
xuanPaper: {
  enable: false,
  variant: 'gold',
},
```

预期：

- [ ] 各页面背景纹理消失
- [ ] 页面变成更平的背景层

### 3. 改印章形状

临时改：

```ts
stamp: {
  enable: true,
  author: '隔窗,听雨',
  type: 'yin',
  shape: 'circle',
},
```

预期：

- [ ] 首页大印章变成圆章
- [ ] 关于页印章变成圆章
- [ ] 文章页落款印章变成圆章
- [ ] 侧边栏印章也同步变成圆章

### 4. 改主色

临时改：

```ts
colors: {
  primary: '#0F766E',
  stamp: '#D4A017',
},
```

预期：

- [ ] 强调色由洋红色变为青绿色
- [ ] hover、边框、圆点、头像边框等一起变化

---

## K. 主题色定位提示

> `colors.primary` 当前主要是强调色，不是大面积背景色。  
> 如果首页不容易看出来，优先看下面这些位置。

- [ ] 先看 `/archives`：时间轴圆点、头像边框、标题 hover 最容易看出主题色
- [ ] 再看 `/categories` 和 `/tags`：边框 hover、文字 hover 很明显
- [ ] 再看文章页正文链接和返回链接：应呈现洋红色 `#FF00AA`

---

## 结论判断

如果 `A-I` 基本全部勾选通过，可以认为：

- `P0-1` 的主要配置兑现目标已经达成
- 当前 demo 足够作为下一阶段 `P0-2` 的回归基线
