"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function ExpectedCollectionForm({
  invoiceId,
  initialDate,
  minimumDate,
}: {
  invoiceId: string;
  initialDate: string | null;
  minimumDate: string;
}) {
  const router = useRouter();
  const [date, setDate] = useState(initialDate ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSaved(false);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/expected-collection`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedCollectionDate: date || null }),
      });
      const json = (await response.json()) as { success?: boolean; error?: { message?: string } };
      if (!response.ok || !json.success) {
        setError(json.error?.message ?? "Could not update the expected collection date.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Could not reach the app. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="cp-panel p-4">
      <h2 className="text-sm font-semibold text-slate-900">Collection expectation</h2>
      <p className="mt-1 text-xs text-slate-600">
        Used only for forecasting. This does not change the invoice due date or balance.
      </p>
      <form onSubmit={submit} className="mt-3 space-y-3">
        <label htmlFor="expected-collection-date" className="block text-sm font-medium text-slate-800">
          Expected collection date
        </label>
        <input
          id="expected-collection-date"
          type="date"
          min={minimumDate}
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="w-full cp-input"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pending}
            className="cp-button-primary disabled:opacity-60"
          >
            {pending ? "Saving..." : "Save expectation"}
          </button>
          {date && (
            <button
              type="button"
              disabled={pending}
              onClick={() => setDate("")}
              className="cp-button-secondary disabled:opacity-60"
            >
              Clear date
            </button>
          )}
        </div>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        {saved && <p role="status" className="text-sm text-green-700">Forecast expectation updated.</p>}
      </form>
    </section>
  );
}
