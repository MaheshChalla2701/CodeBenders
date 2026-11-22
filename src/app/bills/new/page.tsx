import { PageHeader } from "@/components/layout/page-header";
import { AppShell } from "@/components/layout/app-shell";
import { BillForm } from "@/components/bills/bill-form";

export const dynamic = "force-dynamic";

export default function NewBillPage() {
  return (
    <AppShell>
      <PageHeader title="New bill" eyebrow="Expense planning" description="Add a one-time bill or a recurring monthly expense." back={{ href: "/bills", label: "All bills" }} />
      <div className="cp-form-card">
        <BillForm mode="create" />
      </div>
    </AppShell>
  );
}
