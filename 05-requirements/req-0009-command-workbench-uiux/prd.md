# REQ-0009: 纯正黑白灰金融设计系统与三栏指挥作战台需求规格说明书 (PRD)

- **需求 ID**: `REQ-0009`
- **当前状态**: `developing`
- **来源引用**: `SRC-0023` (用户黑白灰设计指示), `SRC-0002` (`retail_performance_workstation/DESIGN.md`), `SRC-0003` (`AegisPlan`)
- **唯一事实源**: `05-requirements/req-0009-command-workbench-uiux/prd.md`

---

## 1. 业务价值与问题陈述

当前 FinMesh 界面存在模式割裂（4 个独立 Tab 跳转）与主题色彩发散的问题。财务总监与高级财务分析师需要高信息密度、极低视觉认知负荷的金融级作战台。
本需求实现：
1. 绝对克制的纯正黑白灰中性主题，杜绝大面积彩色填充与高斯光晕，彩色 100% 仅用于数据图表与红绿方差。
2. 将原先割裂的页面重构为 **3-Pane Command Workbench（左侧组织维度导航、中央多维分析图表、右侧常驻 AI 研报与穿透）**。
3. 移植并融合 AegisPlan 与 Retail Workstation 的核心业务组件（`KpiStatCard`、`PvmWaterfallExplorer`、`SensitivitySandbox`、`CommandMenu`、`AuditDrawer`）。

---

## 2. 界面设计规范与 Design Tokens (`已观察`)

### 2.1 调色盘规范
- **Canvas Background**: `#070A10`
- **Card Surface**: `#0F141C`
- **Secondary Surface**: `#161B22`
- **Border & Dividers**: `#21262D`
- **Primary Text**: `#EDEDED`
- **Muted Text**: `#8B949E`
- **Variance Positive (有利)**: `text-emerald-400`
- **Variance Negative (不利)**: `text-rose-400`
- **Badge / Pill**: `bg-neutral-900 text-neutral-300 border-neutral-800`

### 2.2 排版与字重规范
- 严格只用 3 种字重：`400` (常规正文)、`500` (标签/表头)、`600` (关键数值/标题)；杜绝粗暴的 700/800。
- 所有金额、百分比、方差数值必须应用 `font-mono` 与 `tabular-nums`。

---

## 3. 核心功能与组件设计 (`已观察`)

### 3.1 3-Pane 指挥作战台 (`page.tsx`)
- **左栏 (Pane 1: Dimensions Navigator)**:
  - 组织账套切换（Acme Global Consolidated、Acme US Inc、Acme EMEA Ltd）。
  - 期间与场景选择器（2026-Q1 Actuals、2026 Budget Baseline）。
  - 指标快速透视列表（Revenue、COGS、GP、OPEX、NI）。
  - 工作台模式切换（PVM & Sensitivity、Multi-Dimensional P&L、Causal Driver DAG、Sensitivity Sandbox、Excel Sync）。
- **中栏 (Pane 2: Primary Financial Workspace)**:
  - 顶部 4 联排 `KpiStatCard`（ARR、毛利率、OPEX、Net Income/Runway）。
  - 主视图画布（支持 PVM 瀑布图与敏感性沙盘纵向协同、多维 P&L、React Flow 因果沙盘与 Excel 任务窗格）。
- **右栏 (Pane 3: AI Executive Variance Memo)**:
  - 纯黑白灰卡片表面，展示包含可点击 `MetricToken` 的 AI 经营分析报告。
  - 支持折叠与展开，兼顾汇报与沉浸式沙盘推演。

### 3.2 核心业务组件
1. `KpiStatCard`: 轻量 CSS 火花线、基线比对、财务有利/不利语义箭头与数值。
2. `PvmWaterfallExplorer`: 严格代数守恒校验，底部常驻守恒状态行，柱体中性、方差着色，点击下钻 SKU 贡献。
3. `SensitivitySandbox`: 极简调参滑块，严格区分毛利动因（Price, COGS）与净利动因（Hiring, Churn），支持写入 DuckDB。
4. `CommandMenu`: 全局 `Cmd+K` / `Ctrl+K` 快速命令面板与模糊搜索，支持全键盘导航 (`↑`/`↓`/`Enter`)。
5. `AuditDrawer`: 零幻觉凭证追溯抽屉，展示真实凭证行项目与代数推导公式。

---

## 4. 验收标准 (Acceptance Criteria)

- **AC-001**: 页面无大面积彩色背景与彩色装饰徽章，界面全局符合 `#070A10` / `#0F141C` / `#21262D` 调色规范。
- **AC-002**: 字重严格受控于 400、500、600；所有财务金额使用 `font-mono tabular-nums`。
- **AC-003**: 3-Pane 结构完整，左侧导航、中侧主工作台、右侧 AI Memo 协同交互。
- **AC-004**: PVM 瀑布图提供底部守恒校验行，计算守恒误差 $|\\Delta| \\le 0.01$。
- **AC-005**: `CommandMenu` 支持 `ArrowUp`、`ArrowDown`、`Enter` 键盘选择与切换视图。
- **AC-006**: `AuditDrawer` 所展示的凭证明细与单指标真实金额严格一致，复合指标明确展示代数构成，无虚假凭证回落。
- **AC-007**: `next build` 编译 0 报错，静态路由全部渲染通过。
