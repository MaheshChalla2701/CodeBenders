import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  action?: { href: string; label: string };
  back?: { href: string; label: string };
};

export function PageHeader({ eyebrow, title, description, action, back }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-5">
      <div className="min-w-0">
        {back ? (
          <Link href={back.href} className="mb-4 inline-flex min-h-8 items-center gap-2 text-xs font-medium text-slate-500 hover:text-teal-800">
            <ArrowLeft size={14} aria-hidden="true" />{back.label}
          </Link>
        ) : null}
        <p className="cp-eyebrow">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
      </div>
      {action ? <Link href={action.href} className="cp-button-primary"><Plus size={17} aria-hidden="true" />{action.label}</Link> : null}
    </header>
  );
}
