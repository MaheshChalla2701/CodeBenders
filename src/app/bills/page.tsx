import { PageHeader } from "@/components/layout/page-header";
import { SummaryStrip } from "@/components/layout/summary-strip";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { MarkPaidButton } from "@/components/bills/mark-paid-button";
import { addDaysISO, dueSoon } from "@/lib/financial/bills";
import { formatINR } from "@/lib/financial/money";
import { todayKolkata } from "@/lib/financial/dates";
import { parseBillRange } from "@/lib/schemas/bills";
import { listBillOccurrences } from "@/lib/services/bills";

export const dynamic = "force-dynamic";

type BillsPageProps = {
  searchParams: Promise<{ from?: string; to?: string; status?: string }>;
};

function StatusBadge({ status, paidDate, dueDate, today }: {
  status: "PAID" | "OVERDUE" | "UPCOMING";
  paidDate: string | null;
  dueDate: string;
  today: string;
}) {
  if (status === "PAID") {
    return (
      <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
        Paid {paidDate}
      </span>
    );
  }
  if (status === "OVERDUE") {
    return (
      <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
        Overdue
      </span>
    );
  }
  const soon = dueSoon(dueDate, today);
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        soon ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-700"
      }`}
    >
      Upcoming
    </span>
  );
}

export default async function BillsPage({ searchParams }: BillsPageProps) {
  const params = await searchParams;
  const today = todayKolkata();
  const status = ["PAID", "OVERDUE", "UPCOMING"].includes(params.status ?? "")
    ? (params.status as "PAID" | "OVERDUE" | "UPCOMING")
    : undefined;
  const defaultFrom = status === "OVERDUE" ? addDaysISO(today, -365) : null;
  const defaultTo = status === "OVERDUE" ? today : null;
  const range = parseBillRange(params.from ?? defaultFrom, params.to ?? defaultTo);

  return (
    <AppShell>
      <PageHeader eyebrow="Stay ahead of payments" title="Expenses &amp; Bills" description="Plan recurring expenses and keep track of every bill." action={{ href: "/bills/new", label: "New bill" }} />

      <form key={JSON.stringify([params.from, params.to, status])} method="GET" className="cp-filter-bar">
        <div>
          <label htmlFor="status" className="block font-medium text-slate-800">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status ?? ""}
            className="mt-1 cp-input"
          >
            <option value="">All statuses</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="OVERDUE">Overdue</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
        <div>
          <label htmlFor="from" className="block font-medium text-slate-800">
            From
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={range.success ? range.data.from : today}
            className="mt-1 cp-input"
          />
        </div>
        <div>
          <label htmlFor="to" className="block font-medium text-slate-800">
            To
          </label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={range.success ? range.data.to : ""}
            className="mt-1 cp-input"
          />
        </div>
        <button
          type="submit"
          className="cp-button-secondary"
        >
          Show
        </button>
      </form>

      {!range.success ? (
        <p role="alert" className="mt-6 text-sm text-red-600">
          {range.error.issues[0]?.message ?? "Please correct the date range."}
        </p>
      ) : (
        <BillsTable range={range.data} today={today} status={status} />
      )}
    </AppShell>
  );
}

async function BillsTable({
  range,
  today,
  status,
}: {
  range: { from: string; to: string };
  today: string;
  status?: "PAID" | "OVERDUE" | "UPCOMING";
}) {
  const rows = await listBillOccurrences(range, status);

  if (rows.length === 0) {
    return (
      <div className="mt-6 cp-panel p-6 text-sm text-slate-700">
        No bills yet. Add rent, salaries or subscriptions to see them in your forecast.
      </div>
    );
  }

  return (
    <>
      <SummaryStrip label="Bills in selected range" items={[
        { label: "Bills shown", value: rows.length, detail: "In the selected date range and status", tone: "primary" },
        { label: "Unpaid", value: formatINR(rows.filter((row) => row.status !== "PAID").reduce((sum, row) => sum + row.amountPaise, 0)), detail: "Across the bills shown" },
        { label: "Paid", value: formatINR(rows.filter((row) => row.status === "PAID").reduce((sum, row) => sum + row.amountPaise, 0)), detail: "Settled bills in this view" },
      ]} />
    <div className="mt-6 overflow-x-auto cp-panel">
      <table role="table" className="cp-table divide-y divide-slate-200">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr role="row">
            <th scope="col" className="px-4 py-3 font-medium">Title</th>
            <th scope="col" className="px-4 py-3 font-medium">Category</th>
            <th scope="col" className="px-4 py-3 font-medium">Due date</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Amount</th>
            <th scope="col" className="px-4 py-3 font-medium">Status</th>
            <th scope="col" className="px-4 py-3 font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr role="row" key={`${row.billId}-${row.dueDate}`}>
              <td role="cell" data-label="Title" className="px-4 py-3 text-slate-900">
                <Link href={`/bills/${row.billId}/edit`} className="font-medium hover:underline">
                  {row.title}
                </Link>
              </td>
              <td role="cell" data-label="Category" className="px-4 py-3 text-slate-700">{row.category}</td>
              <td role="cell" data-label="Due date" className="px-4 py-3 text-slate-700">{row.dueDate}</td>
              <td role="cell" data-label="Amount" className="px-4 py-3 text-right text-slate-900">{formatINR(row.amountPaise)}</td>
              <td role="cell" data-label="Status" className="px-4 py-3">
                <StatusBadge
                  status={row.status}
                  paidDate={row.paidDate}
                  dueDate={row.dueDate}
                  today={today}
                />
              </td>
              <td role="cell" data-label="Action" className="px-4 py-3">
                {row.status !== "PAID" && (
                  <MarkPaidButton
                    billId={row.billId}
                    dueDate={row.dueDate}
                    amountPaise={row.amountPaise}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}
