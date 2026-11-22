const STATUS_TONES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  ISSUED_UNPAID: "bg-sky-50 text-sky-800",
  PARTIALLY_PAID: "bg-amber-50 text-amber-800",
  PAID: "bg-teal-50 text-teal-800",
  OVERDUE: "bg-rose-50 text-rose-700",
};
const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  ISSUED_UNPAID: "Unpaid",
  PARTIALLY_PAID: "Partially paid",
  PAID: "Paid",
  OVERDUE: "Overdue",
};

export function InvoiceStatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_TONES[status] ?? STATUS_TONES.DRAFT}`}>{STATUS_LABELS[status] ?? status}</span>;
}
