# FinMesh 项目协作规则 / Collaboration Rules

[中文](#中文) | [English](#english)

---

<a name="中文"></a>
## 中文规则

### 1. 规则入口
详细规则在 `00-rules/` 维护；本文件只保留索引和硬性边界。

| 规则名称 | 唯一维护位置 |
| :--- | :--- |
| 目录职责与命名规范 | `00-rules/naming-and-structure.md` |
| 产品工作流 | `00-rules/product-workflow.md` |
| 需求状态和阶段门槛 | `00-rules/status-and-gates.md` |
| 信息归属与唯一事实源 | `00-rules/source-of-truth.md` |

新增或调整规则时，先修改对应的唯一维护文件。

### 2. 通用执行要求
- 先登记输入，再形成方案；历史文档和截图是输入，不天然等于正式需求。
- 需求应能独立定义、评审、开发和验收。
- 产品判断必须引用来源，使用 `已观察`、`推断`、`待确认`、`未覆盖` 标记结论等级。
- Markdown 是持续维护的内容事实源；Word、PDF 是由已确认内容产生的交付产物。

### 3. 硬性边界
- 新增、修改、删除文件前，必须先说明问题判断和影响范围，取得确认。
- AI 生成内容必须保留来源引用、待确认事项和未覆盖范围。
- 未经确认，AI 不得自行把草稿标记为已批准，不得推进正式状态。
- 密钥、Token、密码不进代码、不进文档、不进 Git 历史。

---

<a name="english"></a>
## English Rules

### 1. Rule Directory Index
Detailed rules are maintained under `00-rules/`; this file retains the index and hard boundaries only.

| Rule Name | Single Source of Truth Path |
| :--- | :--- |
| Directory responsibilities & naming | `00-rules/naming-and-structure.md` |
| Product workflow | `00-rules/product-workflow.md` |
| Requirement status & quality gates | `00-rules/status-and-gates.md` |
| Information ownership & source of truth | `00-rules/source-of-truth.md` |

When adding or modifying rules, update the corresponding single source of truth first.

### 2. General Execution Requirements
- Register raw inputs before proposing solutions; historical files and screenshots are inputs, not formal requirements.
- Each requirement package must be independently definable, reviewable, implementable, and testable.
- Product judgments must cite evidence with confidence levels: `Observed`, `Inferred`, `To-Confirm`, `Uncovered`.
- Markdown is the continuously maintained content source of truth; Word and PDF files are generated deliverables.

### 3. Hard Boundaries
- Before creating, editing, or deleting files, explicitly state problem assessment and impact scope to obtain confirmation.
- AI-generated content must retain source citations, open questions, and out-of-scope boundaries.
- Without user confirmation, AI must never mark drafts as approved or advance formal status.
- Secrets, tokens, and passwords must never enter source code, docs, or Git history.
