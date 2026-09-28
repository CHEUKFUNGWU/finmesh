# FinMesh 纯正黑白灰中性主题与指挥作战台规范 / Monochrome Command Workbench Mandate

- **登记日期 / Date**: 2026-09-28
- **来源 ID / Source ID**: `SRC-0023`
- **提供方 / Provider**: Founder / Product Owner
- **参考系统 / References**: 
  - `https://github.com/CHEUKFUNGWU/retail_performance_workstation` (`DESIGN.md`)
  - `https://github.com/CHEUKFUNGWU/aegisplan`
- **置信度等级**: `已观察` (Observed)

---

## 1. 核心设计原则 (Design Philosophy)

1. **绝对克制的黑白灰中性主题 (Monochrome Neutrality)**:
   - 画布底色: `#070A10`
   - 卡片表面: `#0F141C`
   - 次级表面: `#161B22`
   - 边框与悬浮色: `#21262D`
   - 前景文字: `#EDEDED`
   - 辅助文字: `#8B949E`
   - 彻底去除大面积彩色填充与高斯模糊光晕。所有状态标签与徽章统一收敛为黑底灰字白边 (`bg-neutral-900 text-neutral-300 border-neutral-800`)。

2. **彩色仅作为图表与方差载体 (Color Strictness)**:
   - 界面常规框架（导航、按钮、文本、表格、抽屉）100% 保持黑白灰。
   - 彩色唯一出现的场景：
     - 数据图表（瀑布图与柱状图的数据系列）
     - 财务方差红绿正负（有利 `text-emerald-400`、不利 `text-rose-400`）
     - 可追溯 Audit Token 标签的哈希指引

3. **字重克制与数据对齐 (Tabular Figures & Typography)**:
   - 严格只用 3 种字重：`400` (常规)、`500` (中等/表头)、`600` (关键数值/标题)，杜绝 700/800 粗暴字重。
   - 所有金额、百分比、方差数值应用 `font-mono tabular-nums`。

---

## 2. 核心组件与 3-Pane 指挥作战台

1. `KpiStatCard`: 4 联排高密度指标卡，带火花线与凭证联动。
2. `PvmWaterfallExplorer`: 价格-销量-结构方差分解瀑布图，具备代数公式守恒校验与底层固定守恒行。
3. `SensitivitySandbox`: 极简调参滑块，严格区分毛利动因（Price, COGS）与净利动因（Hiring, Churn），支持写入 DuckDB。
4. `CommandMenu`: 全局 `Cmd+K` 快速命令面板与模糊搜索，支持全键盘导航。
5. `AuditDrawer`: 零幻觉 DuckDB 列式证明与凭证追溯抽屉。
6. `3-Pane Command Workbench`:
   - 左栏：维度与组织账套树形导航
   - 中栏：多维主工作台与图表沙盘
   - 右栏：AI Executive Variance Memo 与穿透审计
