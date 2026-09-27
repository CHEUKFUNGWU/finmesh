export interface FormulaQuery {
  id: string;
  metricName: string;
  period: string;
  scenario?: string;
  department?: string;
  resolve: (res: FormulaResult) => void;
}

export interface FormulaResult {
  value: number;
  formula?: string;
  sqlHash?: string;
  status: "ok" | "error";
  error?: string;
  executionMs: number;
}

class CustomFunctionBatchEvaluator {
  private queue: FormulaQuery[] = [];
  private timer: NodeJS.Timeout | null = null;
  private debounceMs = 50;
  private backendUrl = process.env.NEXT_PUBLIC_FINMESH_API_URL || "http://localhost:8080";

  public evaluate(metricName: string, period: string, scenario = "actual", department = ""): Promise<FormulaResult> {
    return new Promise<FormulaResult>((resolve) => {
      const id = `${metricName}_${period}_${scenario}_${department}_${Math.random().toString(36).substring(7)}`;
      this.queue.push({
        id,
        metricName,
        period,
        scenario,
        department,
        resolve,
      });

      if (!this.timer) {
        this.timer = setTimeout(() => {
          this.flush();
        }, this.debounceMs);
      }
    });
  }

  private async flush() {
    const currentBatch = [...this.queue];
    this.queue = [];
    this.timer = null;

    if (currentBatch.length === 0) return;

    try {
      const payload = {
        queries: currentBatch.map((q) => ({
          metric_name: q.metricName,
          period: q.period,
          scenario: q.scenario,
          department: q.department,
        })),
      };

      const res = await fetch(`${this.backendUrl}/api/v1/metrics/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const json = await res.json();
      const results: any[] = json.results || [];

      currentBatch.forEach((item, idx) => {
        const r = results[idx];
        if (r && r.status === "ok") {
          item.resolve({
            value: r.value,
            formula: r.formula,
            sqlHash: r.sql_hash,
            status: "ok",
            executionMs: r.execution_ms || 1.2,
          });
        } else {
          item.resolve({
            value: 0,
            status: "error",
            error: r?.error || "#FINMESH.QUERY_ERR!",
            executionMs: r?.execution_ms || 1.0,
          });
        }
      });
    } catch (err: any) {
      // Zero-Hallucination Invariant: Never fabricate audited numbers or hashes when backend is unreachable
      currentBatch.forEach((item) => {
        item.resolve({
          value: 0,
          status: "error",
          error: `#FINMESH.NETWORK_ERR: Backend unreachable (${err?.message || "connection refused"})`,
          executionMs: 0.0,
        });
      });
    }
  }
}

export const functionEvaluator = new CustomFunctionBatchEvaluator();
