# 需求状态与阶段门槛 / Status & Quality Gates

[中文](#中文) | [English](#english)

---

<a name="中文"></a>
## 中文规则

### 1. 状态流转图

```text
candidate → collecting → analyzing → defined → reviewing → approved → developing → validating → released → closed
```

*注：早期轻量起步阶段，可主要关注 `candidate → analyzing → defined → approved → released → closed` 六个核心里程碑状态。*

### 2. 各阶段含义与门槛条件

| 状态 | 中文含义 | 准入要求与产出标准 (Gate) | 责任角色 |
| :--- | :--- | :--- | :--- |
| **`candidate`** | 候选需求 | 在 `04-requirement-pool/requirement-pool.md` 完成登记，具备清晰的业务问题陈述和输入来源 `SRC-XXXX`。 | 需求提出人 / PM |
| **`collecting`** | 调研收集 | 收集用户声音、竞品逻辑与背景数据，归档至 `01-inputs/`。 | 产品经理 |
| **`analyzing`** | 需求分析 | 完成业务价值与技术可行性评估，明确影响的系统模块（关联 `03-planning/`）。 | 产品 / 架构师 |
| **`defined`** | 完成定义 | 在 `05-requirements/req-XXXX/` 输出完整规范、用例边界与验收标准（AC）。 | 产品经理 |
| **`reviewing`** | 评审中 | 组织技术、设计、业务负责人联合评审，记录待修改项。 | 评审团队 |
| **`approved`** | 评审通过 | 架构、设计、业务三方确认签字，已分配至目标版本 `06-versions/`。 | 产品 / 技术负责人 |
| **`developing`** | 开发实施 | 需求代码正在编写与单元测试中。 | 研发团队 |
| **`validating`** | 测试验收 | 功能已部署测试环境，完成产品经理对标 PRD 的验收。 | 测试 / PM |
| **`released`** | 正式发布 | 功能已部署生产环境，并具备真实线上运行/验证证据。 | 研发 / 运维 |
| **`closed`** | 归档关闭 | 完成上线后复盘（归档至 `07-reviews/`），指标达成追踪完毕。 | 产品经理 |

### 3. 关键纪律

1. **唯一状态源**：需求状态**只在需求池 (`04-requirement-pool/requirement-pool.md`) 统一维护**，禁止在单需求 PRD 内部自造不同步的状态标签。
2. **变更倒流机制**：一旦处于 `approved` 或 `developing` 状态的需求发生实质性业务或技术方案变更，必须记录变更内容，状态强制回退至 `reviewing`，重新评审确认。
3. **真实证据门槛**：标记为 `released` 的需求，必须附带线上环境验证截图、API 响应日志或测试验收签字记录，杜绝“代码合并即代表发布”的假象。

---

<a name="english"></a>
## English Rules

### 1. Status Transition Pipeline

```text
candidate → collecting → analyzing → defined → reviewing → approved → developing → validating → released → closed
```

*Note: During early-stage delivery, teams can primarily focus on the six core milestone states: `candidate → analyzing → defined → approved → released → closed`.*

### 2. Phase Definitions & Quality Gates

| Status | Meaning | Entry Criteria & Deliverables (Gate) | Responsible Role |
| :--- | :--- | :--- | :--- |
| **`candidate`** | Candidate | Registered in `04-requirement-pool/requirement-pool.md` with clear business problem statement and input source `SRC-XXXX`. | Submitter / PM |
| **`collecting`** | Collecting | User feedback, competitor workflows, and context data gathered into `01-inputs/`. | Product Manager |
| **`analyzing`** | Analyzing | Business value and technical feasibility assessed; affected system modules mapped (`03-planning/`). | PM / Architect |
| **`defined`** | Defined | Comprehensive specs, edge cases, and acceptance criteria (AC) completed in `05-requirements/req-XXXX/`. | Product Manager |
| **`reviewing`** | In Review | Joint review by engineering, design, and business leads conducted; pending items logged. | Review Team |
| **`approved`** | Approved | Tripartite sign-off confirmed; requirement allocated to target version in `06-versions/`. | PM / Tech Lead |
| **`developing`** | In Dev | Active code implementation and unit testing in progress. | Engineering Team |
| **`validating`** | Validating | Deployed to test environment; verified against PRD acceptance criteria. | QA / PM |
| **`released`** | Released | Deployed to production with verifiable live operational evidence. | Engineering / DevOps |
| **`closed`** | Closed | Post-release retrospective logged (`07-reviews/`); metric tracking completed. | Product Manager |

### 3. Critical Disciplines

1. **Single Status Source**: Requirement status is **maintained strictly in the requirement pool (`04-requirement-pool/requirement-pool.md`)**. Maintaining unsynchronized status tags inside individual PRDs is prohibited.
2. **Reverse Flow Mechanism**: When an `approved` or `developing` requirement encounters substantive business or architectural changes, revisions must be logged and the status reverted to `reviewing` for re-approval.
3. **Verifiable Evidence Gate**: Marking a requirement as `released` requires production verification screenshots, API response logs, or sign-off notes. Merging code does not constitute release.

