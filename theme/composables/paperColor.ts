// 宣纸基色 —— useXuanPaperTexture 生成整页纸时的 light 模式 `processed` 变体底色。
// 作为独立常量抽出来，是为了给 useHeroScene 等需要"纸色"参考的地方共享，避免色值漂移。
export const XUAN_PAPER_LIGHT_RGB: readonly [number, number, number] = [252, 248, 230]
