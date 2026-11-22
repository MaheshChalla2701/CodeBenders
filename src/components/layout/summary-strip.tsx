import type { ReactNode } from "react";

export function SummaryStrip({ items, label = "Overview" }: {
  items: { label: string; value: ReactNode; detail: string; tone?: "primary" | "danger" }[];
  label?: string;
}) {
  return (
    <section aria-label={label} className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className={item.tone === "primary" ? "rounded-2xl bg-[#123e3a] p-5 text-white shadow-sm" : "cp-panel p-5"}>
          <p className={item.tone === "primary" ? "text-xs font-medium text-teal-100" : "text-xs font-medium text-slate-500"}>{item.label}</p>
          <p className={`mt-3 break-words text-2xl font-semibold tracking-tight tabular-nums ${item.tone === "danger" ? "text-rose-700" : ""}`}>{item.value}</p>
          <p className={`mt-2 text-xs ${item.tone === "primary" ? "text-teal-100" : "text-slate-500"}`}>{item.detail}</p>
        </div>
      ))}
    </section>
  );
}
