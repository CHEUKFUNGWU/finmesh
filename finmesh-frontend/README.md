# FinMesh Frontend Workspace (finmesh-frontend)

[中文](#中文) | [English](#english)

---

<a name="中文"></a>
## 中文说明

`finmesh-frontend` 是 FinMesh 的现代化财务工作台前端工程，基于 Next.js 15+ App Router、React 19、Tailwind CSS 与 `@xyflow/react` 构建。

### 1. 核心特性
- **多维 P&L 报表交互 (`src/components/report/PnLTable.tsx`)**：支持 12 个月与季度多版本对比（Actual vs Budget），内置差异色彩高亮。
- **What-If 因果驱动沙盘 (`src/components/canvas/DriverCanvas.tsx`)**：可视化敏感度调节滑块，支持毫秒级级联重算。
- **零幻觉数字穿透抽屉 (`src/components/audit/AuditDrawer.tsx`)**：正文中所有财务指标均可点击反查 DuckDB SQL、公式元数据与底层记账凭证。

### 2. 本地开发与构建
```bash
# 进入前端目录并安装依赖
cd finmesh-frontend
pnpm install

# 启动本地开发服务
pnpm dev

# 生产环境打包
pnpm build
```

---

<a name="english"></a>
## English Overview

`finmesh-frontend` is the modern financial planning & analysis workspace for FinMesh, built with Next.js 15+ App Router, React 19, Tailwind CSS, and `@xyflow/react`.

### 1. Key Highlights
- **Interactive Multi-dimensional P&L (`src/components/report/PnLTable.tsx`)**: Compares Actuals vs Budget with financial conditional styling.
- **What-If Causal Sandbox (`src/components/canvas/DriverCanvas.tsx`)**: Parameter sliders enabling instant cascaded sensitivity recomputation.
- **Zero-Hallucination Audit Drawer (`src/components/audit/AuditDrawer.tsx`)**: Every financial figure is clickable to inspect exact DuckDB SQL, formulas, and GL journal lines.

### 2. Local Development & Build
```bash
# Navigate to directory and install dependencies
cd finmesh-frontend
pnpm install

# Start development server
pnpm dev

# Production build
pnpm build
```
