# REQ-0003: React Flow 驱动因果沙盘画布与 What-If 模拟 / React Flow Causal Driver Canvas & What-If

[中文](#中文) | [English](#english)

---

<a name="中文"></a>
## 中文说明

本目录包含需求 `REQ-0003` 的全部设计与实现资产。

- **完整需求规格说明**：详见 [prd.md](prd.md)
- **需求生命周期状态唯一维护位置**：[04-requirement-pool/requirement-pool.md](../../04-requirement-pool/requirement-pool.md)
- **核心模块**：画布推演 (React Flow / @xyflow/react 拓扑因果沙盘 + 毫秒级重算引擎)
- **前置依赖**：`REQ-0002`（依赖语义指标引擎提供的基准值与公式元数据）
- **后置依赖**：`REQ-0004`（AI 审计 Memo 需要对推演差异生成归因总结）

---

<a name="english"></a>
## English Overview

This directory houses all specification and implementation artifacts for `REQ-0003`.

- **Comprehensive PRD**: See [prd.md](prd.md)
- **Lifecycle Status Source of Truth**: [04-requirement-pool/requirement-pool.md](../../04-requirement-pool/requirement-pool.md)
- **Core Module**: Canvas & Simulation (React Flow / @xyflow/react Causal Sandbox + Sub-100ms Recalculation)
- **Dependencies**: `REQ-0002` (Depends on Semantic Metric Engine for baseline figures and formula metadata)
- **Downstream**: `REQ-0004` (AI Audit Memo generates narrative attributions on simulation deltas)
