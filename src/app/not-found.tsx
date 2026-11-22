import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center p-6">
      <div className="cp-panel p-8">
        <p className="cp-eyebrow mb-3">Nothing here yet</p>
        <h1 className="text-xl font-semibold text-slate-900">Record not found</h1>
        <p className="mt-2 text-sm text-slate-600">
          The requested CashPilot record does not exist or is no longer available.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block cp-button-primary"
        >
          Return to dashboard
        </Link>
      </div>
    </main>
  );
}
