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
      <body className="min-h-screen bg-[#0B0F19] text-[#F3F4F6] antialiased">
        <header className="border-b border-neutral-800 bg-[#111827] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-neutral-200 text-sm">
              FM
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white leading-none">FinMesh Workspace</h1>
              <span className="text-xs text-neutral-400 mt-1 block">Milestone 1 • Go Core & DuckDB Columnar</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
              DuckDB Engine Online
            </span>
            <span className="text-neutral-400 border-l border-neutral-800 pl-4">v0.1-alpha</span>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
