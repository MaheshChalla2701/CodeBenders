import { PageHeader } from "@/components/layout/page-header";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { CustomerForm } from "@/components/customers/customer-form";
import { getCustomerDetail } from "@/lib/services/customers";

type EditCustomerPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const { id } = await params;
  let detail: Awaited<ReturnType<typeof getCustomerDetail>>;
  try {
    detail = await getCustomerDetail(id);
  } catch {
    notFound();
  }
  const { customer } = detail;

  return (
    <AppShell>
      <Link href={`/customers/${customer.id}`} className="text-sm text-slate-600 hover:underline">
        ← Back to {customer.name}
      </Link>
      <PageHeader title="Edit customer" eyebrow="Customer directory" description="Keep contact and billing details up to date." />
      <div className="cp-form-card">
        <CustomerForm
          mode="edit"
          customerId={customer.id}
          initial={{
            name: customer.name,
            companyName: customer.companyName ?? "",
            email: customer.email ?? "",
            phone: customer.phone ?? "",
            address: customer.address ?? "",
            notes: customer.notes ?? "",
          }}
        />
      </div>
    </AppShell>
  );
}
