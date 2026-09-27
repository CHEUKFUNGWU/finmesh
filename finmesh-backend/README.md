# FinMesh Core Backend (finmesh-backend)

[中文](#中文) | [English](#english)

---

<a name="中文"></a>
## 中文说明

`finmesh-backend` 是 FinMesh 的高性能财务计算中台与 Model Context Protocol (MCP) 服务端，基于 Go 1.25+ 与嵌入式列式计算引擎 DuckDB 构建。

### 1. 核心架构与模块职责
- **数据接入 (`internal/ingest`)**：支持 Excel (`excelize/v2`) 与 CSV 流式解析，强制执行借贷试算平衡守恒校验（`Trial Balance Equilibrium: SUM(Debit) == SUM(Credit)`），杜绝单边账入库。
- **存储管理 (`internal/storage`)**：封装 DuckDB 嵌入式实例（支持内存模式与租户物理文件隔离），维护统一明细事实表 `fact_general_ledger`。
- **语义指标引擎 (`internal/semantic`)**：基于 YAML 声明式指标元数据，通过 Kahn 算法执行拓扑排序以保证 DAG 计算顺序并防止循环引用；将业务指标动态编译为确定性 DuckDB SQL 并执行多维透视与 PVM 方差拆解。
- **开放中枢 (`internal/mcp`)**：基于 `mark3labs/mcp-go` 暴露 5 大生产级 MCP 财务计算工具（`query_financial_metric`、`get_metric_catalog`、`explain_variance`、`drilldown_transaction_ledger`、`simulate_whatif`），支持 `stdio` 与 `http/sse` 传输模式。

### 2. 运行与验证
```bash
# 运行全部单元测试
go test -v ./...

# 编译主程序
go build -o bin/finmesh-server ./cmd/server

# 以 stdio 模式启动（供本地 IDE、Claude Desktop 或 Cursor 接入）
./bin/finmesh-server -mode=stdio

# 以 HTTP/SSE 模式启动
./bin/finmesh-server -mode=http -port=8080
```

---

<a name="english"></a>
## English Overview

`finmesh-backend` is the high-performance financial compute core and Model Context Protocol (MCP) server for FinMesh, built with Go 1.25+ and embedded columnar database DuckDB.

### 1. Core Architecture & Modules
- **Data Ingestion (`internal/ingest`)**: Streaming Excel (`excelize/v2`) and CSV ingestion engine enforcing strict Double-Entry Trial Balance equilibrium (`SUM(Debit) == SUM(Credit)`), rejecting unbalanced ledger batches.
- **Storage Layer (`internal/storage`)**: Embedded DuckDB connection pool supporting in-memory and disk-backed tenant files, managing the canonical `fact_general_ledger` table.
- **Semantic Metric Engine (`internal/semantic`)**: Declarative YAML metric catalog with Kahn's topological DAG dependency compilation, cycle detection, deterministic SQL generation, and PVM variance decomposition.
- **MCP Hub (`internal/mcp`)**: Native Go Model Context Protocol server exposing 5 core tools (`query_financial_metric`, `get_metric_catalog`, `explain_variance`, `drilldown_transaction_ledger`, `simulate_whatif`) with `stdio` and `http/sse` transports.

### 2. Running and Testing
```bash
# Run all unit tests
go test -v ./...

# Compile server binary
go build -o bin/finmesh-server ./cmd/server

# Start in stdio mode (for Claude Desktop, Cursor, or local CLI agents)
./bin/finmesh-server -mode=stdio

# Start in HTTP/SSE mode
./bin/finmesh-server -mode=http -port=8080
```
