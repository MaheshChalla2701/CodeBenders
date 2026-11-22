"use client";

import { useEffect, useState } from "react";

interface ReminderPanelProps {
  invoiceId: string;
  outstandingPaise: number;
}

interface ReminderResponse {
  success?: boolean;
  text?: string | null;
  data?: { text?: string | null };
  error?: { message?: string };
}

export function ReminderPanel({ invoiceId, outstandingPaise }: ReminderPanelProps) {
  const [text, setText] = useState("");
  const [hasText, setHasText] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`/api/invoices/${invoiceId}/reminder`);
        const json = (await response.json()) as ReminderResponse;
        if (cancelled) return;
        if (!response.ok) {
          setLoadError(json.error?.message ?? "Could not load the reminder draft.");
          return;
        }
        const reminderText = json.data?.text ?? json.text ?? null;
        setHasText(reminderText !== null);
        setText(reminderText ?? "");
      } catch {
        if (!cancelled) {
          setLoadError("Could not load the reminder draft. Check that the app is running.");
        }
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [invoiceId, outstandingPaise]);

  async function handleCopy() {
    setCopyMessage(null);
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage("Copied to clipboard.");
    } catch {
      setCopyMessage("Could not copy automatically. Select the text and copy it manually.");
    }
  }

  return (
    <section id="payment-reminder" className="scroll-mt-6 cp-panel p-4">
      <h2 className="text-sm font-semibold text-slate-900">Payment reminder</h2>

      {!loaded && <p className="mt-2 text-sm text-slate-600">Loading reminder...</p>}

      {loaded && loadError && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {loadError}
        </p>
      )}

      {loaded && !loadError && !hasText && (
        <p className="mt-2 text-sm text-slate-600">Nothing is outstanding on this invoice.</p>
      )}

      {loaded && !loadError && hasText && (
        <div className="mt-2 space-y-3">
          <p className="text-xs text-slate-600">
            This is a draft you can copy. CashPilot does not send it.
          </p>
          <label htmlFor="reminder-text" className="sr-only">
            Reminder text
          </label>
          <textarea
            id="reminder-text"
            rows={6}
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="w-full cp-input"
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="cp-button-secondary"
            >
              Copy
            </button>
            {copyMessage && (
              <p role="status" className="text-sm text-slate-700">
                {copyMessage}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
