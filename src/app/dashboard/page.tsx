import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, ArrowRight, Plus, Wallet, CalendarDays, Receipt, CircleAlert, CheckCircle2, Clock3, Sparkles, type LucideIcon } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { CashOutlookChart } from "@/components/dashboard/cash-outlook-chart";
import { ReceivablesList } from "@/components/dashboard/receivables-list";
import { formatINR } from "@/lib/financial/money";
import { getDashboardData } from "@/lib/services/dashboard";
import { ServiceError } from "@/lib/services/errors";

export const dynamic = "force-dynamic";
const panel = "rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_8px_-4px_rgba(15,23,42,0.12)]";
const textLink = "inline-flex min-h-10 items-center gap-1.5 text-xs font-semibold text-teal-800 hover:underline focus-visible:outline-teal-700";
function dateLabel(date: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}
function Metric({ label, value, detail, icon: Icon, primary = false, href }: { label: string; value: number; detail: string; icon: LucideIcon; primary?: boolean; href: string }) {
  return <Link href={href} className={`group block min-w-0 rounded-2xl p-5 transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${primary ? "bg-[#123e3a] text-white shadow-lg shadow-teal-900/10" : `${panel} hover:border-teal-300`}`}>
    <div className="flex items-center justify-between gap-2"><p className={`text-xs font-medium ${primary ? "text-teal-100" : "text-slate-500"}`}>{label}</p><Icon size={17} className={primary ? "text-teal-200" : "text-slate-400"} aria-hidden="true" /></div>
    <p className="mt-4 break-words text-[28px] font-semibold leading-tight tracking-tight tabular-nums">{formatINR(value)}</p>
    <div className={`mt-4 flex items-center justify-between gap-2 text-[11px] ${primary ? "text-teal-100" : "text-slate-500"}`}><span>{detail}</span><ArrowUpRight size={14} className="shrink-0" aria-hidden="true" /></div>
  </Link>;
}

export default async function DashboardPage() {
  let data;
  try { data = await getDashboardData(30); }
  catch (error) {
    if (error instanceof ServiceError && error.code === "NOT_FOUND") redirect("/setup");
    return <DashboardShell businessName="CashPilot"><h1 className="text-2xl font-semibold">Dashboard</h1><p role="alert" className="mt-6 rounded-xl bg-red-50 p-6 text-sm text-red-800">We could not load your business details. Check that the database is migrated.</p></DashboardShell>;
  }
  const { profile, summary, forecast, alerts } = data;
  const receivables = data.receivables.slice(0, 10);
  const bills = data.upcomingBills.slice(0, 7);
  return (
    <DashboardShell businessName={profile.businessName}>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-700">Your business at a glance</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Dashboard</h1><p className="mt-2 text-sm text-slate-500">A clearer view of your money, and what needs your attention.</p></div>
        <div className="flex flex-wrap items-center gap-3"><span className="flex items-center gap-2 text-xs text-slate-500"><CalendarDays size={15} aria-hidden="true" />{dateLabel(data.today)}, {data.today.slice(0, 4)}</span><Link href="/invoices/new" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-800 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"><Plus size={17} aria-hidden="true" />New invoice</Link></div>
      </header>
      <section aria-label="Financial summary" className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric primary label="Recorded cash" value={summary.recordedCashPaise} detail={`Opening snapshot · ${dateLabel(profile.openingCashDate)}`} icon={Wallet} href="/forecast" />
        <Metric label="Total outstanding" value={summary.totalOutstandingPaise} detail={`${summary.openInvoiceCount} open invoices to collect`} icon={ArrowDownLeft} href="/invoices" />
        <Metric label="Overdue receivables" value={summary.overduePaise} detail={`${summary.overdueInvoiceCount} invoices need follow-up`} icon={Clock3} href="/invoices?status=OVERDUE" />
        <Metric label="Bills due in next 30 days" value={summary.upcomingBillsPaise} detail={`${summary.upcomingBillCount} upcoming unpaid bills`} icon={Receipt} href="/bills" />
      </section>
      <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className={`${panel} min-w-0 p-5 sm:p-6`}>
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-base font-semibold tracking-tight">30-day cash outlook</h2><p className="mt-1 text-xs text-slate-500">Expected receipts and bills, brought into one view.</p></div><Link href="/forecast?horizon=30" className={textLink}>Open full forecast <ArrowUpRight size={15} aria-hidden="true" /></Link></div>
          <div className="mb-5 mt-5 flex flex-wrap items-center gap-x-8 gap-y-3"><div><p className="text-[11px] text-slate-500">Projected cash at day 30</p><p className={`mt-1 text-2xl font-semibold tracking-tight tabular-nums ${summary.projectedCashPaise < 0 ? "text-rose-700" : "text-slate-900"}`}>{formatINR(summary.projectedCashPaise)}</p></div><div className="border-l border-slate-200 pl-5"><p className="text-[11px] text-slate-500">Lowest projected balance</p><p className="mt-1 text-sm font-semibold tabular-nums">{formatINR(forecast.minimumCashPaise)} <span className="font-normal text-slate-500">on {dateLabel(forecast.minimumCashDate)}</span></p></div></div>
          <CashOutlookChart points={forecast.points} />
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><span className="flex items-center gap-2 text-[11px] text-slate-500"><span className="h-2 w-2 rounded-full bg-teal-700" />Projected day-end balance · estimates, not guarantees</span><span className={`flex items-center gap-1.5 text-[11px] font-medium ${forecast.firstShortfallDate ? "text-rose-700" : "text-teal-700"}`}>{forecast.firstShortfallDate ? <CircleAlert size={14} aria-hidden="true" /> : <CheckCircle2 size={14} aria-hidden="true" />}{forecast.firstShortfallDate ? `Shortfall from ${dateLabel(forecast.firstShortfallDate)}` : "No projected shortfall"}</span></div>
        </section>
        <section className={`${panel} flex min-h-0 flex-col p-5`}>
          <div className="flex items-center justify-between"><h2 className="text-base font-semibold">Action Center</h2><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">{alerts.length}</span></div><p className="mt-1 text-xs text-slate-500">Your next steps, in priority order.</p>
          <div className="mt-5 max-h-[368px] space-y-3 overflow-y-auto pr-1" tabIndex={0} aria-label="All dashboard alerts">
            {alerts.length === 0 ? <div className="rounded-xl bg-teal-50 p-5 text-sm text-teal-900"><CheckCircle2 className="mb-3" aria-hidden="true" />You’re all caught up.<p className="mt-2 text-xs">No alerts. Nothing needs action today.</p></div> : alerts.map((alert) => <article key={alert.id} className={`rounded-xl border p-3.5 ${alert.severity === "critical" ? "border-rose-100 bg-rose-50/60" : "border-amber-100 bg-amber-50/50"}`}><p className={`mb-2 text-[9px] font-bold uppercase tracking-widest ${alert.severity === "critical" ? "text-rose-700" : "text-amber-800"}`}>{alert.severity === "critical" ? "Needs attention" : "Upcoming"}</p><h3 className="text-xs font-semibold leading-5">{alert.headline}</h3><p className="mt-1 text-[11px] leading-5 text-slate-600">{alert.explanation}</p><Link href={alert.actionHref} className="mt-2 inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-slate-800 underline decoration-slate-300 underline-offset-4 hover:text-teal-800">{alert.actionLabel}<ArrowRight size={13} aria-hidden="true" /></Link></article>)}
          </div>
        </section>
      </div>
      <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className={`${panel} min-w-0 overflow-hidden`}>
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 sm:px-6"><div><h2 className="text-base font-semibold">Who owes money</h2><p className="mt-1 text-xs text-slate-500">Overdue invoices first. Keep collections moving.</p></div><Link href="/invoices" className={textLink}>All invoices <ArrowUpRight size={15} aria-hidden="true" /></Link></div>
          <ReceivablesList rows={receivables} />
          <p className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-500">Showing {receivables.length} of {summary.openInvoiceCount} open invoices</p>
        </section>
        <div className="space-y-5">
          <section className={`${panel} p-5`}><div className="flex items-center justify-between"><h2 className="text-base font-semibold">Upcoming bills</h2><Receipt size={18} className="text-slate-400" aria-hidden="true" /></div><p className="mt-1 text-xs text-slate-500">Due in the next 7 days</p><ul className="mt-4 divide-y divide-slate-100">{bills.map((row) => <li key={`${row.billId}-${row.dueDate}`} className="flex items-center justify-between gap-3 py-3.5"><div className="min-w-0"><Link href={`/bills/${row.billId}/edit`} className="text-xs font-semibold hover:text-teal-800 hover:underline">{row.title}</Link><p className="mt-1 text-[11px] text-slate-500">Due {dateLabel(row.dueDate)}</p></div><span className="shrink-0 text-xs font-semibold tabular-nums">{formatINR(row.amountPaise)}</span></li>)}</ul>{!bills.length && <p className="py-6 text-xs leading-6 text-slate-500">A little breathing room. No unpaid bills due in the next 7 days.</p>}<Link href="/bills" className={`${textLink} mt-2 w-full justify-between border-t border-slate-100 pt-3`}>All bills <ArrowRight size={14} aria-hidden="true" /></Link></section>
          <Link href="/assistant" className="group block rounded-2xl border border-teal-100 bg-teal-50/70 p-5 hover:bg-teal-50"><Sparkles size={20} className="text-teal-700" aria-hidden="true" /><h2 className="mt-3 text-sm font-semibold text-teal-950">Make sense of your numbers.</h2><p className="mt-2 text-xs leading-5 text-teal-900/70">Explore your cash flow or prepare an invoice with CashPilot.</p><span className="mt-4 flex items-center gap-2 text-xs font-semibold text-teal-800">Ask your assistant <ArrowUpRight size={14} aria-hidden="true" /></span></Link>
        </div>
      </div>
      <footer className="mt-7 flex flex-wrap justify-between gap-2 text-[11px] text-slate-500"><span>{profile.businessName} · Local workspace</span><span>Amounts in INR · Forecasts depend on recorded data</span></footer>
    </DashboardShell>
  );
}
