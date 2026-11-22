import { isInvoiceCommandText } from "@/lib/assistant/invoice-command";

export const ASSISTANT_AGENTS = [
  "invoice",
  "forecast",
  "receivables",
  "bills",
  "reminder",
  "direct",
] as const;

export type AssistantAgent = (typeof ASSISTANT_AGENTS)[number];

export type AssistantRoute = {
  agent: AssistantAgent;
  mode: "action" | "read" | "direct";
  requiresConfirmation: boolean;
};

const EDUCATIONAL_RE =
  /^(?:what\s+(?:is|are|does)|explain|define|how\s+does|why\s+does|help\s+me\s+understand|tell\s+me\s+about)\b/i;
const RECORD_CONTEXT_RE =
  /\b(?:my|our|we|current|today|record(?:s|ed)?|customer|invoice\s*(?:number|#)|INV-[A-Z0-9_-]+)\b/i;

const REMINDER_RE = /\b(?:reminder|follow[- ]?up|payment\s+message|collection\s+message)\b/i;
const FORECAST_RE =
  /\b(?:cash\s*flow|cash\s+forecast|forecast|projected\s+cash|cash\s+position|cash\s+(?:cover|covers|covering)|shortfall|runway|enough\s+cash|what[- ]?if|delay(?:ed)?|days?\s+late|later)\b/i;
const RECEIVABLES_RE =
  /\b(?:receivable|outstanding|overdue|money\s+(?:owed|due)|owe(?:s|d)?\s+(?:me|us)|customer(?:s)?\s+owe|unpaid\s+invoice|invoice|collection)\b/i;
const BILLS_RE =
  /\b(?:bills?|expenses?|payables?|vendors?|suppliers?|outgoing|payment\s+due)\b/i;

/**
 * Selects one narrowly scoped assistant agent. This router never performs work itself.
 * Write-capable intents are marked as actions and must be confirmed by the user.
 */
export function routeAssistantMessage(message: string): AssistantRoute {
  const text = message.trim();

  if (REMINDER_RE.test(text)) {
    return { agent: "reminder", mode: "read", requiresConfirmation: false };
  }

  if (isInvoiceCommandText(text)) {
    return { agent: "invoice", mode: "action", requiresConfirmation: true };
  }

  // General educational questions belong to Direct AI unless the owner explicitly asks
  // about their own records.
  if (EDUCATIONAL_RE.test(text) && !RECORD_CONTEXT_RE.test(text)) {
    return { agent: "direct", mode: "direct", requiresConfirmation: false };
  }

  // Forecast takes precedence over bills because forecast questions often mention bills.
  if (FORECAST_RE.test(text)) {
    return { agent: "forecast", mode: "read", requiresConfirmation: false };
  }

  if (RECEIVABLES_RE.test(text)) {
    return { agent: "receivables", mode: "read", requiresConfirmation: false };
  }

  if (BILLS_RE.test(text)) {
    return { agent: "bills", mode: "read", requiresConfirmation: false };
  }

  return { agent: "direct", mode: "direct", requiresConfirmation: false };
}
