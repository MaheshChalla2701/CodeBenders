"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, LayoutDashboard, Users, FileText, Receipt, ChartNoAxesCombined, Sparkles, Settings, Wallet, ShieldCheck } from "lucide-react";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/bills", label: "Expenses & Bills", icon: Receipt },
  { href: "/forecast", label: "Cash Forecast", icon: ChartNoAxesCombined },
  { href: "/assistant", label: "AI Assistant", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function WorkspaceShell({ children, businessName }: { children: ReactNode; businessName: string }) {
  const pathname = usePathname();
  return (
    <div className="cp-workspace min-h-screen bg-[#f5f7f8] text-slate-900 selection:bg-teal-100">
      <a href="#main-content" className="sr-only z-50 rounded-lg bg-white p-3 shadow-lg focus:not-sr-only focus:fixed focus:left-3 focus:top-3">Skip to main content</a>
      <aside className="border-b border-slate-200 bg-white md:fixed md:inset-y-0 md:left-0 md:z-20 md:flex md:w-56 md:flex-col md:overflow-y-auto md:border-b-0 md:border-r xl:w-60">
        <Link href="/dashboard" className="flex items-center gap-3 px-6 py-7 focus-visible:outline-teal-700">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-800 text-white"><Wallet size={21} aria-hidden="true" /></span>
          <span className="text-xl font-bold tracking-tight">CashPilot<span className="ml-1 text-teal-700">.</span></span>
        </Link>
        <p className="hidden px-7 pb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 md:block">Workspace</p>
        <nav aria-label="Primary" className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible md:px-4">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${active ? "bg-teal-50 text-teal-900" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
              >
                <Icon size={18} aria-hidden="true" />
                {label}
                {active && <span className="ml-auto hidden h-1.5 w-1.5 rounded-full bg-teal-700 md:block" />}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto hidden p-4 md:block">
          <div className="rounded-2xl bg-slate-50 p-4"><Sparkles size={20} className="text-teal-700" aria-hidden="true" /><p className="mt-3 text-sm font-semibold">A little clarity goes a long way.</p><p className="mt-2 text-xs leading-5 text-slate-500">Ask CashPilot about your invoices, bills and cash flow.</p><Link href="/assistant" className="mt-3 flex min-h-10 items-center justify-between text-xs font-semibold text-teal-800 hover:underline">Open assistant <ArrowUpRight size={15} aria-hidden="true" /></Link></div>
          <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-900">{businessName.slice(0, 2).toUpperCase()}</span><div className="min-w-0"><p className="truncate text-xs font-semibold" title={businessName}>{businessName}</p><p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500"><ShieldCheck size={12} aria-hidden="true" /> Local workspace</p></div></div>
        </div>
      </aside>
      <main id="main-content" tabIndex={-1} className="min-w-0 px-4 py-6 focus:outline-none sm:px-7 md:ml-56 lg:px-9 lg:py-8 xl:ml-60"><div className="mx-auto max-w-[1440px]">{children}</div></main>
    </div>
  );
}
