import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ArchiveButton } from "@/components/customers/archive-button";
import { formatINR } from "@/lib/financial/money";
import { getCustomerDetail } from "@/lib/services/customers";

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>;
};

function SummaryCard({ label, value, tone }: { label: string; value: string; tone?: "red" }) {
  return (
    <div className="cp-panel p-4">
      <p className="text-sm text-slate-600">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${tone === "red" ? "text-red-700" : "text-slate-900"}`}>
        {value}
      </p>
    </div>
  );
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;
  let detail: Awaited<ReturnType<typeof getCustomerDetail>>;
  try {
    detail = await getCustomerDetail(id);
  } catch {
    notFound();
  }
  const { customer, invoices, payments, summary } = detail;

  const issued = invoices.filter((invoice) => invoice.lifecycle === "ISSUED");
  const totalInvoicedPaise = issued.reduce((sum, invoice) => sum + invoice.totalPaise, 0);
  const receivedPaise = issued.reduce((sum, invoice) => sum + invoice.paidPaise, 0);

  return (
    <AppShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/customers" className="text-sm text-slate-600 hover:underline">
            ← All customers
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{customer.name}</h1>
            {customer.archivedAt && (
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                Archived
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-start gap-3">
          <Link
            href={`/customers/${customer.id}/edit`}
            className="cp-button-secondary"
          >
            Edit
          </Link>
          {customer.archivedAt === null && (
            <Link
              href={`/invoices/new?customerId=${customer.id}`}
              className="cp-button-primary"
            >
              Add invoice
            </Link>
          )}
          <ArchiveButton customerId={customer.id} archived={customer.archivedAt !== null} />
        </div>
      </div>

      <div className="mt-6 cp-panel p-6">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-600">Company</dt>
            <dd className="text-slate-900">{customer.companyName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-600">Email</dt>
            <dd className="text-slate-900">{customer.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-600">Phone</dt>
            <dd className="text-slate-900">{customer.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-600">Address</dt>
            <dd className="whitespace-pre-line text-slate-900">{customer.address ?? "—"}</dd>
          </div>
          {customer.notes && (
            <div className="sm:col-span-2">
              <dt className="text-slate-600">Notes</dt>
              <dd className="whitespace-pre-line text-slate-900">{customer.notes}</dd>
            </div>
          )}
        </dl>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard label="Total invoiced" value={formatINR(totalInvoicedPaise)} />
        <SummaryCard label="Received" value={formatINR(receivedPaise)} />
        <SummaryCard label="Outstanding" value={formatINR(summary.outstandingPaise)} />
        <SummaryCard
          label="Overdue amount"
          value={formatINR(summary.overdueOutstandingPaise)}
          tone="red"
        />
        <SummaryCard label="Unpaid invoices" value={String(summary.openInvoiceCount)} />
        <SummaryCard label="Overdue invoices" value={String(summary.overdueInvoiceCount)} />
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900">Invoices</h2>
        {invoices.length === 0 ? (
          <div className="mt-3 cp-panel p-6">
            <p className="text-sm text-slate-600">No invoices for this customer yet.</p>
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto cp-panel">
            <table role="table" className="cp-table divide-y divide-slate-200">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr role="row">
                  <th scope="col" className="px-4 py-3 font-medium">Number</th>
                  <th scope="col" className="px-4 py-3 font-medium">Issue date</th>
                  <th scope="col" className="px-4 py-3 font-medium">Due date</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Total</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Outstanding</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((invoice) => (
                  <tr role="row" key={invoice.id} className="hover:bg-slate-50">
                    <td role="cell" data-label="Number" className="px-4 py-3 font-medium text-slate-900">{invoice.invoiceNumber}</td>
                    <td role="cell" data-label="Issue date" className="px-4 py-3 text-slate-700">{invoice.issueDate}</td>
                    <td role="cell" data-label="Due date" className="px-4 py-3 text-slate-700">
                      {invoice.dueDate}
                      {invoice.overdue && (
                        <span className="ml-2 text-xs text-red-700">
                          {invoice.overdueDays} day(s) overdue
                        </span>
                      )}
                    </td>
                    <td role="cell" data-label="Total" className="px-4 py-3 text-right text-slate-900">{formatINR(invoice.totalPaise)}</td>
                    <td role="cell" data-label="Outstanding" className="px-4 py-3 text-right text-slate-900">
                      {formatINR(invoice.outstandingPaise)}
                    </td>
                    <td role="cell" data-label="Status" className="px-4 py-3 text-slate-700"><InvoiceStatusBadge status={invoice.status} /></td>
                    <td role="cell" data-label="Open" className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        {invoice.lifecycle === "DRAFT" && (
                          <Link href={`/invoices/${invoice.id}/edit`} className="text-slate-900 underline">
                            Edit
                          </Link>
                        )}
                        <Link href={`/invoices/${invoice.id}`} className="text-slate-900 underline">
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900">Payment history</h2>
        {payments.length === 0 ? (
          <div className="mt-3 cp-panel p-6">
            <p className="text-sm text-slate-600">No payments recorded yet.</p>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100 cp-panel">
            {payments.map((payment) => (
              <li key={payment.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span className="text-slate-700">{payment.paymentDate}</span>
                <span className="font-medium text-slate-900">{payment.invoiceNumber}</span>
                <span className="text-slate-700">{payment.method}</span>
                <span className="font-medium text-slate-900">{formatINR(payment.amountPaise)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
