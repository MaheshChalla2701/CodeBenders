import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { InvoiceForm, type CustomerOption } from "@/components/invoices/invoice-form";
import { todayKolkata } from "@/lib/financial/dates";
import { ServiceError } from "@/lib/services/errors";
import { listCustomers } from "@/lib/services/customers";
import { getInvoiceDetail } from "@/lib/services/invoices";

type EditInvoicePageProps = {
  params: Promise<{ id: string }>;
};

async function loadInvoice(id: string) {
  try {
    return await getInvoiceDetail(id);
  } catch (error) {
    if (error instanceof ServiceError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
}

export default async function EditInvoicePage({ params }: EditInvoicePageProps) {
  const { id } = await params;
  const invoice = await loadInvoice(id);

  if (invoice.lifecycle !== "DRAFT") {
    return (
      <AppShell>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{invoice.invoiceNumber}</h1>
        <div className="mt-6 cp-panel p-6">
          <p className="font-medium text-slate-900">Issued invoices cannot be edited.</p>
          <Link href={`/invoices/${invoice.id}`} className="mt-2 inline-block text-sm text-slate-700 underline">
            Back to invoice
          </Link>
        </div>
      </AppShell>
    );
  }

  const customers: CustomerOption[] = (await listCustomers()).map((customer) => ({
    id: customer.id,
    name: customer.name,
  }));
  // The assigned customer may be archived, which listCustomers hides; keep it selectable.
  if (!customers.some((customer) => customer.id === invoice.customer.id)) {
    customers.push({ id: invoice.customer.id, name: invoice.customer.name });
  }

  return (
    <AppShell>
      <Link href={`/invoices/${invoice.id}`} className="text-sm text-teal-800 hover:underline">← Back to invoice</Link>
      <p className="cp-eyebrow mt-5">Invoice workspace</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Edit draft {invoice.invoiceNumber}</h1>
      <p className="mt-2 text-sm text-slate-500">Review the details before issuing this invoice.</p>
      <div className="cp-form-card">
        <InvoiceForm
          mode="edit"
          invoiceId={invoice.id}
          customers={customers}
          defaultDate={todayKolkata()}
          initial={{
            customerId: invoice.customer.id,
            invoiceNumber: invoice.invoiceNumber,
            issueDate: invoice.issueDate,
            dueDate: invoice.dueDate,
            expectedCollectionDate: invoice.expectedCollectionDate ?? "",
            notes: invoice.notes ?? "",
            paymentInstructions: invoice.paymentInstructions ?? "",
            items: invoice.items.map((item) => ({
              description: item.description,
              quantity: String(item.quantityMilli / 1000),
              unitPrice: (item.unitPricePaise / 100).toFixed(2),
            })),
          }}
        />
      </div>
    </AppShell>
  );
}
