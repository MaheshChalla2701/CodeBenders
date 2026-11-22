import { PageHeader } from "@/components/layout/page-header";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { todayKolkata } from "@/lib/financial/dates";
import { listCustomers } from "@/lib/services/customers";

export const dynamic = "force-dynamic";

type NewInvoicePageProps = {
  searchParams: Promise<{ customerId?: string | string[] }>;
};

export default async function NewInvoicePage({ searchParams }: NewInvoicePageProps) {
  const { customerId } = await searchParams;
  const customers = await listCustomers();
  // listCustomers returns non-archived customers only; an unknown or archived id is ignored.
  const requestedId = Array.isArray(customerId) ? customerId[0] : customerId;
  const initialCustomerId = customers.some((customer) => customer.id === requestedId) ? requestedId : undefined;

  return (
    <AppShell>
      <PageHeader title="New invoice" eyebrow="Invoice workspace" description="Save as a draft first. You can edit a draft until you issue it." back={{ href: "/invoices", label: "All invoices" }} />
      <div className="cp-form-card">
        <InvoiceForm
          mode="create"
          customers={customers.map((customer) => ({ id: customer.id, name: customer.name }))}
          defaultDate={todayKolkata()}
          initialCustomerId={initialCustomerId}
        />
        {customers.length === 0 && (
          <p className="mt-4 text-sm text-slate-600">
            No customers yet.{" "}
            <Link href="/customers/new" className="font-medium text-slate-900 underline">
              Add a customer
            </Link>{" "}
            before creating an invoice.
          </p>
        )}
      </div>
    </AppShell>
  );
}
