import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { BillForm } from "@/components/bills/bill-form";
import { ArchiveBillButton } from "@/components/bills/archive-bill-button";
import { todayKolkata } from "@/lib/financial/dates";
import { getBillDetail } from "@/lib/services/bills";
import { ServiceError } from "@/lib/services/errors";

export const dynamic = "force-dynamic";

type EditBillPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditBillPage({ params }: EditBillPageProps) {
  const { id } = await params;
  const today = todayKolkata();
  const bill = await getBillDetail(id, { from: today, to: today }).catch((error: unknown) => {
    if (error instanceof ServiceError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  });

  return (
    <AppShell>
      <p className="cp-eyebrow">Expense planning</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Edit bill</h1>
      <p className="mt-1 text-sm text-slate-600">{bill.title}</p>

      <div className="cp-form-card">
        <BillForm
          mode="edit"
          billId={bill.id}
          initial={{
            title: bill.title,
            category: bill.category,
            amountRupees: (bill.defaultAmountPaise / 100).toFixed(2),
            firstDueDate: bill.firstDueDate,
            recurrence: bill.recurrence,
            notes: bill.notes ?? "",
          }}
        />
      </div>

      <div className="cp-form-card">
        <h2 className="text-base font-semibold text-slate-900">Archive</h2>
        {bill.archivedOn !== null ? (
          <p className="mt-2 text-sm text-slate-700">
            This bill was archived on {bill.archivedOn}. Its paid history is kept.
          </p>
        ) : (
          <div className="mt-2">
            <ArchiveBillButton billId={bill.id} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
