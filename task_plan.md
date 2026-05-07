# 代码审查与重构计划

## 目标

- 找出当前 Valaxy Shuimo 主题中实现不够优雅、维护成本高或类型/响应式边界不清晰的代码。
- 在不回退现有工作区改动的前提下，完成小范围、低风险重构。
- 使用 `pnpm lint`、`pnpm typecheck` 和必要时 `pnpm build` 验证。

## 阶段

1. [complete] 扫描项目结构、当前改动和高复杂度文件。
2. [complete] 记录主要审查发现并确定可安全重构范围。
3. [complete] 执行重构，保持组件边界和数据流清晰。
4. [complete] 运行验证命令并修复暴露的问题。
5. [complete] 汇总变更、审查结论和剩余风险。

## 决策

- 优先处理 `theme/` 中 Vue SFC、composables、类型声明和导出入口。
- 不修改生成目录 `demo/.valaxy`、`demo/dist`。
- 不回退用户已有改动。
