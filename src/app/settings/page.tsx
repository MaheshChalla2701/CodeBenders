import { PageHeader } from "@/components/layout/page-header";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { BusinessForm, type BusinessFormInitial } from "@/components/business/business-form";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const profile = await prisma.businessProfile.findUnique({
    where: { id: "local-business" },
  });

  if (!profile) {
    redirect("/setup");
  }

  const initial: BusinessFormInitial = {
    businessName: profile.businessName,
    ownerName: profile.ownerName,
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    address: profile.address ?? "",
    openingCashRupees: (profile.openingCashPaise / 100).toFixed(2),
    openingCashDate: profile.openingCashDate,
    paymentInstructions: profile.paymentInstructions ?? "",
  };

  return (
    <AppShell>
      <PageHeader title="Settings" eyebrow="Your workspace" description="Manage your business profile, opening balance, and payment details." />
      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
      <section className="cp-panel p-5 sm:p-8">
        <h2 className="mb-6 text-base font-semibold text-slate-900">Business details</h2>
        <BusinessForm mode="edit" initial={initial} />
      </section>
      <aside className="space-y-5">
        <section className="rounded-2xl border border-teal-100 bg-teal-50/70 p-5">
          <p className="cp-eyebrow">Your financial starting point</p>
          <h2 className="mt-3 text-base font-semibold text-teal-950">Keep your forecast grounded.</h2>
          <p className="mt-2 text-sm leading-6 text-teal-900/80">Your opening cash balance and date are the starting point for every projection. Recorded payments and bills build on that snapshot.</p>
        </section>
        <section className="cp-panel p-5">
          <h2 className="text-sm font-semibold text-slate-900">Details that travel with your invoices</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Keep your business contact information and payment instructions current so customers know how to reach you and pay.</p>
          <p className="mt-4 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">Select Save business details to apply your changes.</p>
        </section>
      </aside>
      </div>
    </AppShell>
  );
}
