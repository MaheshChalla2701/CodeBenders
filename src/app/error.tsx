"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center p-6">
      <div className="cp-panel p-8">
        <h1 className="text-xl font-semibold text-slate-900">CashPilot could not load this page</h1>
        <p className="mt-2 text-sm text-slate-600">
          Your saved records were not changed. Check that the local database is available, then try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 cp-button-primary"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
