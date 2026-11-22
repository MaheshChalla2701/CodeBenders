import { Wallet } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { redirect } from "next/navigation";
import { BusinessForm } from "@/components/business/business-form";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const existing = await prisma.businessProfile.findUnique({
    where: { id: "local-business" },
    select: { id: true },
  });

  if (existing) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-10 sm:py-16">
      <div className="mb-8 flex items-center gap-3 text-xl font-bold tracking-tight"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-800 text-white"><Wallet size={22} aria-hidden="true" /></span>CashPilot<span className="text-teal-700">.</span></div>
      <PageHeader eyebrow="A clearer view starts here" title="Set up your business" description="Add your business details and opening cash balance to get started. You can update these in Settings later." />
      <div className="cp-form-card">
        <BusinessForm mode="create" />
      </div>
    </main>
  );
}
