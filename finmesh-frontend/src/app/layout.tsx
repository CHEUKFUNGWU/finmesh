import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinMesh - Next-Gen Financial Workspace & Decision Engine",
  description: "Declarative financial intelligence, causal driver sandbox, and autonomous FP&A auditing.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#070A10] text-[#EDEDED] antialiased">
        <header className="border-b border-[#21262D] bg-[#0F141C] px-6 py-3 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center font-mono font-semibold text-neutral-300 text-xs">
              FM
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-[#EDEDED] leading-none">FinMesh Command Workbench</h1>
              <span className="text-[11px] text-[#8B949E] mt-1 block">DuckDB Columnar OLAP • Zero-Hallucination FP&A</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-neutral-900 text-neutral-300 border border-neutral-800">
              DuckDB Engine Online
            </span>
            <span className="text-neutral-500 border-l border-[#21262D] pl-3 text-[11px] font-mono">v0.1-alpha</span>
          </div>
        </header>
        <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
