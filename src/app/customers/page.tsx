import { PageHeader } from "@/components/layout/page-header";
import { SummaryStrip } from "@/components/layout/summary-strip";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { formatINR } from "@/lib/financial/money";
import { listCustomers } from "@/lib/services/customers";

type CustomersPageProps = {
  searchParams: Promise<{ search?: string }>;
};

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const { search } = await searchParams;
  const term = search?.trim() ?? "";
  const customers = await listCustomers({ search: term || undefined });

  return (
    <AppShell>
      <PageHeader eyebrow="Your relationships" title="Customers" description="Keep customer details, balances, and payment history together." action={{ href: "/customers/new", label: "New customer" }} />

      <SummaryStrip label="Customer overview" items={[
        { label: term ? "Matching customers" : "Customers", value: customers.length, detail: term ? "In this search" : "Active customer relationships", tone: "primary" },
        { label: "Outstanding", value: formatINR(customers.reduce((sum, customer) => sum + customer.summary.outstandingPaise, 0)), detail: "Across the customers shown" },
        { label: "Overdue", value: formatINR(customers.reduce((sum, customer) => sum + customer.summary.overdueOutstandingPaise, 0)), detail: "Collections that need attention", tone: "danger" },
      ]} />

      <form key={term} method="GET" action="/customers" className="cp-filter-bar">
        <label htmlFor="search" className="sr-only">
          Search customers
        </label>
        <input
          id="search"
          name="search"
          type="search"
          defaultValue={term}
          placeholder="Search by name, company, email or phone"
          className="w-full max-w-md cp-input"
        />
        <button
          type="submit"
          className="cp-button-secondary"
        >
          Search
        </button>
        {term && <Link href="/customers" className="cp-button-secondary">Clear search</Link>}
      </form>

      {customers.length === 0 ? (
        <div className="mt-6 cp-panel p-6">
          <p className="text-sm text-slate-600">
            {term
              ? `No customers match "${term}".`
              : "No customers yet. Add your first client to start invoicing."}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto cp-panel">
          <table role="table" className="cp-table divide-y divide-slate-200">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr role="row">
                <th scope="col" className="px-4 py-3 font-medium">Name</th>
                <th scope="col" className="px-4 py-3 font-medium">Company</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Outstanding</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Overdue</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Unpaid invoices</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((customer) => (
                <tr role="row" key={customer.id} className="hover:bg-slate-50">
                  <td role="cell" data-label="Name" className="px-4 py-3">
                    <Link href={`/customers/${customer.id}`} className="font-medium text-slate-900 hover:underline">
                      {customer.name}
                    </Link>
                    {customer.archivedAt && (
                      <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700">
                        Archived
                      </span>
                    )}
                  </td>
                  <td role="cell" data-label="Company" className="px-4 py-3 text-slate-700">{customer.companyName ?? "—"}</td>
                  <td role="cell" data-label="Outstanding" className="px-4 py-3 text-right text-slate-900">
                    {formatINR(customer.summary.outstandingPaise)}
                  </td>
                  <td role="cell" data-label="Overdue" className="px-4 py-3 text-right text-red-700">
                    {formatINR(customer.summary.overdueOutstandingPaise)}
                  </td>
                  <td role="cell" data-label="Unpaid invoices" className="px-4 py-3 text-right text-slate-700">
                    {customer.summary.openInvoiceCount}
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
