import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { todayKolkata } from "@/lib/financial/dates";
import { listCustomers } from "@/lib/services/customers";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  const customers = await listCustomers();

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold text-gray-900">New invoice</h1>
      <p className="mt-1 text-sm text-gray-600">
        Save as a draft first. You can edit a draft until you issue it.
      </p>
      <div className="mt-6 max-w-3xl rounded-lg border border-gray-200 bg-white p-6">
        <InvoiceForm
          mode="create"
          customers={customers.map((customer) => ({ id: customer.id, name: customer.name }))}
          defaultDate={todayKolkata()}
        />
        {customers.length === 0 && (
          <p className="mt-4 text-sm text-gray-600">
            No customers yet.{" "}
            <Link href="/customers/new" className="font-medium text-gray-900 underline">
              Add a customer
            </Link>{" "}
            before creating an invoice.
          </p>
        )}
      </div>
    </AppShell>
  );
}
