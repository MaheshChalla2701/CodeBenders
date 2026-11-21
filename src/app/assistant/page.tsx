import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { AssistantPanel } from "@/components/assistant/assistant-panel";
import { getAssistantStatus } from "@/lib/services/assistant";

export const dynamic = "force-dynamic";

export default async function AssistantPage() {
  const status = await getAssistantStatus();
  if (!status.businessExists) redirect("/setup");
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold text-gray-900">AI Assistant</h1>
      <p className="mt-1 text-sm text-gray-600">
        Optional online explanations built from CashPilot&apos;s read-only calculation tools.
      </p>
      <div className="mt-6">
        <AssistantPanel initialStatus={status} />
      </div>
    </AppShell>
  );
}
