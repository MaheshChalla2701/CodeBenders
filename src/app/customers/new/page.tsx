import { PageHeader } from "@/components/layout/page-header";
import { AppShell } from "@/components/layout/app-shell";
import { CustomerForm } from "@/components/customers/customer-form";

export const dynamic = "force-dynamic";

export default function NewCustomerPage() {
  return (
    <AppShell>
      <PageHeader title="New customer" eyebrow="Customer directory" description="Add a customer and keep their billing details in one place." back={{ href: "/customers", label: "All customers" }} />
      <div className="cp-form-card">
        <CustomerForm mode="create" />
      </div>
    </AppShell>
  );
}
