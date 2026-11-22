import Link from "next/link";
import { formatINR } from "@/lib/financial/money";
import type { getDashboardData } from "@/lib/services/dashboard";

type Receivable = Awaited<ReturnType<typeof getDashboardData>>["receivables"][number];

export function ReceivablesList({ rows }: { rows: Receivable[] }) {
  if (!rows.length) {
    return <p className="p-6 text-sm text-slate-500">Nothing is owed right now.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="block w-full text-left text-xs sm:table">
        <thead className="sr-only border-y border-slate-100 bg-slate-50/80 text-[10px] uppercase tracking-wider text-slate-500 sm:not-sr-only sm:table-header-group">
          <tr>
            <th className="px-5 py-3 font-medium" scope="col">Customer / invoice</th>
            <th className="px-3 py-3 font-medium" scope="col">Due date</th>
            <th className="px-3 py-3 font-medium" scope="col">Status</th>
            <th className="px-5 py-3 text-right font-medium" scope="col">Outstanding</th>
          </tr>
        </thead>
        <tbody className="block divide-y divide-slate-100 sm:table-row-group">
          {rows.map((row, index) => (
            <tr key={row.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 px-5 py-4 transition hover:bg-slate-50/70 sm:table-row sm:p-0">
              <td className="min-w-0 sm:px-5 sm:py-4">
                <div className="flex items-center gap-3">
                  <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-semibold ${index % 2 ? "bg-indigo-50 text-indigo-700" : "bg-teal-50 text-teal-800"}`}>
                    {row.customer.name.split(/\s+/).map((word) => word[0]).slice(0, 2).join("")}
                  </span>
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-slate-800">{row.customer.name}</p>
                    <Link className="mt-1 inline-block text-[11px] text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-teal-800" href={`/invoices/${row.id}`}>
                      {row.invoiceNumber}
                    </Link>
                  </div>
                </div>
              </td>
              <td className="col-start-1 row-start-2 whitespace-nowrap text-slate-500 sm:px-3 sm:py-4">
                <span className="sm:hidden">Due </span>
                {new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${row.dueDate}T00:00:00Z`))}
              </td>
              <td className="col-start-2 row-start-2 text-right sm:px-3 sm:py-4 sm:text-left">
                <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-medium ${row.overdue ? "bg-rose-50 text-rose-700" : "bg-teal-50 text-teal-800"}`}>
                  {row.overdue ? `${row.overdueDays} days overdue` : "Not yet due"}
                </span>
              </td>
              <td className="col-start-2 row-start-1 whitespace-nowrap text-right font-semibold tabular-nums sm:px-5 sm:py-4">
                <span className="sr-only sm:hidden">Outstanding </span>{formatINR(row.outstandingPaise)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
