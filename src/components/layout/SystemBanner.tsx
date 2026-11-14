import Link from "next/link";
import { AlertTriangle, ArrowUpRight } from "lucide-react";
import { envWarnings } from "@/lib/env-status";

/**
 * Honest configuration banner for the dashboard shell.
 *
 * Server-rendered from `process.env` on every request, so it disappears as
 * soon as the operator sets the missing values. It never renders secret
 * values, only which keys are absent.
 */
export function SystemBanner() {
  const warnings = envWarnings();
  if (warnings.length === 0) return null;

  return (
    <div className="border-b border-amber-500/25 bg-amber-500/[0.07] px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-2">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Setup incomplete — this deployment is not production-ready
        </p>
        <ul className="flex flex-col gap-1.5">
          {warnings.map((w) => (
            <li key={w.key} className="text-[13px] leading-relaxed text-amber-100/80">
              {w.message}{" "}
              <Link
                href={w.href}
                className="inline-flex items-center gap-0.5 font-medium text-amber-300 underline decoration-amber-500/40 underline-offset-2 hover:text-amber-200"
              >
                setup guide
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
