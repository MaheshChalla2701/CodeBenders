"use client";

import { useState, type FormEvent } from "react";
import type { AssistantStatus } from "@/lib/services/assistant";

type QueryResult = { answer: string; factsUsed: string[] };
type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  error?: { message?: string };
};

const EXAMPLES = [
  "How much money do customers owe me?",
  "Which invoices are overdue?",
  "Will I have enough cash for bills in the next 30 days?",
];

export function AssistantPanel({ initialStatus }: { initialStatus: AssistantStatus }) {
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [consentPending, setConsentPending] = useState(false);

  async function updateConsent(consent: boolean) {
    setConsentPending(true);
    setError(null);
    try {
      const response = await fetch("/api/assistant/consent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent }),
      });
      const json = (await response.json()) as ApiResponse<AssistantStatus>;
      if (!response.ok || !json.data) {
        setError(json.error?.message ?? "Could not update AI consent.");
        return;
      }
      setStatus(json.data);
      if (!consent) setResult(null);
    } catch {
      setError("Could not reach the app. Try again.");
    } finally {
      setConsentPending(false);
    }
  }

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) return;
    setPending(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/assistant/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const json = (await response.json()) as ApiResponse<QueryResult>;
      if (!response.ok || !json.data) {
        setError(json.error?.message ?? "The assistant could not answer right now.");
        return;
      }
      setResult(json.data);
    } catch {
      setError("Could not reach the assistant. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-blue-200 bg-blue-50 p-5">
        <h2 className="font-semibold text-gray-900">External AI privacy choice</h2>
        <p className="mt-2 text-sm text-gray-700">
          Groq processes selected financial details online. Your SQLite database stays on this
          computer, but the minimal facts needed for each question are sent to Groq. Contact
          details and the full database are not sent.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={consentPending}
            onClick={() => void updateConsent(!status.consented)}
            className={`rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60 ${
              status.consented
                ? "border border-gray-300 bg-white text-gray-900 hover:bg-gray-100"
                : "bg-gray-900 text-white hover:bg-gray-800"
            }`}
          >
            {consentPending
              ? "Saving..."
              : status.consented
                ? "Revoke AI consent"
                : "I understand — enable AI"}
          </button>
          <span className="text-sm text-gray-700">
            {status.consented ? "Consent enabled" : "No AI request will be made"}
          </span>
        </div>
      </section>

      {!status.configured && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Groq is not configured. Add <code>GROQ_API_KEY</code> and <code>GROQ_MODEL</code> to
          <code> .env</code>, then restart the app. All non-AI CashPilot features remain available.
        </div>
      )}

      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="font-semibold text-gray-900">Ask about your saved financial records</h2>
        <p className="mt-1 text-sm text-gray-600">
          Answers are read-only and grounded in CashPilot&apos;s receivables, bills, and deterministic
          30-day forecast.
        </p>

        <div className="mt-4 flex flex-wrap gap-2" aria-label="Example questions">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setMessage(example)}
              className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
            >
              {example}
            </button>
          ))}
        </div>

        <form onSubmit={ask} className="mt-4 space-y-3">
          <label htmlFor="assistant-message" className="block text-sm font-medium text-gray-800">
            Financial question
          </label>
          <textarea
            id="assistant-message"
            rows={4}
            maxLength={1000}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="For example: What happens if INV-0004 is paid 15 days late?"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
          <button
            type="submit"
            disabled={pending || !status.available || message.trim().length < 3}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Checking your records..." : "Ask CashPilot"}
          </button>
        </form>

        {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
        {result && (
          <article className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-900">CashPilot answer</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-800">{result.answer}</p>
            <p className="mt-3 text-xs text-gray-500">
              Facts used: {result.factsUsed.join(" · ")}. No records were changed.
            </p>
          </article>
        )}
      </section>
    </div>
  );
}
