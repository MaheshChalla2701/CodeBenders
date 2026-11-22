import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { SummaryStrip } from "@/components/layout/summary-strip";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { formatINR } from "@/lib/financial/money";
import { listCustomers } from "@/lib/services/customers";
import { listInvoices, type InvoiceListFilters } from "@/lib/services/invoices";

type InvoicesPageProps = {
  searchParams: Promise<{
    status?: string;
    customerId?: string;
    search?: string;
    dueFrom?: string;
    dueTo?: string;
  }>;
};

const STATUS_OPTIONS: { value: NonNullable<InvoiceListFilters["status"]>; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "ISSUED_UNPAID", label: "Issued, unpaid" },
  { value: "PARTIALLY_PAID", label: "Partially paid" },
  { value: "PAID", label: "Paid" },
  { value: "OVERDUE", label: "Overdue" },
];

const selectClass =
  "cp-input";

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const params = await searchParams;
  const rawStatus = params.status ?? "";
  const status = STATUS_OPTIONS.find((option) => option.value === rawStatus)?.value;
  const customerId = params.customerId?.trim() || undefined;
  const search = params.search?.trim() || undefined;
  const dueFrom = params.dueFrom?.trim() || undefined;
  const dueTo = params.dueTo?.trim() || undefined;

  const [invoices, customers] = await Promise.all([
    listInvoices({ status, customerId, search, dueFrom, dueTo }),
    listCustomers(),
  ]);
  const hasFilters = Boolean(status || customerId || search || dueFrom || dueTo);

  return (
    <AppShell>
      <PageHeader eyebrow="Get paid with confidence" title="Invoices" description="Create invoices, track collections, and follow up on outstanding payments." action={{ href: "/invoices/new", label: "New invoice" }} />

      <SummaryStrip label="Invoice overview" items={[
        { label: "Invoices shown", value: invoices.length, detail: hasFilters ? "Matching your filters" : "Across all invoice statuses", tone: "primary" },
        { label: "Outstanding on issued invoices", value: formatINR(invoices.filter((invoice) => invoice.lifecycle === "ISSUED").reduce((sum, invoice) => sum + invoice.outstandingPaise, 0)), detail: "For the invoices shown" },
        { label: "Overdue", value: formatINR(invoices.filter((invoice) => invoice.overdueDays > 0 && invoice.lifecycle === "ISSUED").reduce((sum, invoice) => sum + invoice.outstandingPaise, 0)), detail: "Outstanding payments past their due date", tone: "danger" },
      ]} />

      <form key={JSON.stringify([status, customerId, search, dueFrom, dueTo])} method="GET" action="/invoices" className="cp-filter-bar">
        <div>
          <label htmlFor="status" className="block text-xs font-medium text-slate-700">
            Status
          </label>
          <select id="status" name="status" defaultValue={status ?? ""} className={selectClass}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="dueFrom" className="block text-xs font-medium text-slate-700">
            Due from
          </label>
          <input
            id="dueFrom"
            name="dueFrom"
            type="date"
            defaultValue={dueFrom ?? ""}
            className={selectClass}
          />
        </div>
        <div>
          <label htmlFor="dueTo" className="block text-xs font-medium text-slate-700">
            Due to
          </label>
          <input
            id="dueTo"
            name="dueTo"
            type="date"
            defaultValue={dueTo ?? ""}
            min={dueFrom}
            className={selectClass}
          />
        </div>
        <div>
          <label htmlFor="customerId" className="block text-xs font-medium text-slate-700">
            Customer
          </label>
          <select id="customerId" name="customerId" defaultValue={customerId ?? ""} className={selectClass}>
            <option value="">All customers</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="search" className="block text-xs font-medium text-slate-700">
            Search
          </label>
          <input
            id="search"
            name="search"
            type="search"
            defaultValue={search ?? ""}
            placeholder="Invoice number or customer"
            className={`${selectClass} w-64`}
          />
        </div>
        <button
          type="submit"
          className="cp-button-secondary"
        >
          Apply
        </button>
        {hasFilters && <Link href="/invoices" className="cp-button-secondary">Clear filters</Link>}
      </form>

      {invoices.length === 0 ? (
        <div className="mt-6 cp-panel p-6">
          <p className="text-sm text-slate-600">
            {hasFilters ? "No invoices match these filters." : "No invoices yet."}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto cp-panel">
          <table role="table" className="cp-table divide-y divide-slate-200">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr role="row">
                <th scope="col" className="px-4 py-3 font-medium">Invoice</th>
                <th scope="col" className="px-4 py-3 font-medium">Customer</th>
                <th scope="col" className="px-4 py-3 font-medium">Issued</th>
                <th scope="col" className="px-4 py-3 font-medium">Due</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Total</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Received</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Outstanding</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((invoice) => (
                <tr role="row" key={invoice.id} className="hover:bg-slate-50">
                  <td role="cell" data-label="Invoice" className="px-4 py-3">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td role="cell" data-label="Customer" className="px-4 py-3 text-slate-700">{invoice.customer.name}</td>
                  <td role="cell" data-label="Issued" className="px-4 py-3 text-slate-700">{invoice.issueDate}</td>
                  <td role="cell" data-label="Due" className="px-4 py-3 text-slate-700">
                    {invoice.dueDate}
                    {invoice.overdue && (
                      <span className="ml-2 text-xs font-medium text-red-700">
                        {invoice.overdueDays} {invoice.overdueDays === 1 ? "day" : "days"} overdue
                      </span>
                    )}
                  </td>
                  <td role="cell" data-label="Total" className="px-4 py-3 text-right text-slate-900">{formatINR(invoice.totalPaise)}</td>
                  <td role="cell" data-label="Received" className="px-4 py-3 text-right text-slate-700">{formatINR(invoice.paidPaise)}</td>
                  <td role="cell" data-label="Outstanding" className="px-4 py-3 text-right text-slate-900">
                    {formatINR(invoice.outstandingPaise)}
                  </td>
                  <td role="cell" data-label="Status" className="px-4 py-3 text-slate-700">
                    <InvoiceStatusBadge status={invoice.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
