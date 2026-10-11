import { ShieldCheck } from "lucide-react";

export function PrivacyBanner() {
  return (
    <div className="border border-border bg-zinc-950 p-4 rounded-lg flex items-start gap-3.5 mb-6">
      <div className="size-6 rounded border border-zinc-700 bg-zinc-900 flex items-center justify-center shrink-0 mt-0.5">
        <ShieldCheck className="size-3.5 text-zinc-300" strokeWidth={1.75} />
      </div>
      <div className="space-y-1">
        <h4 className="font-mono text-xs font-semibold text-white tracking-wide uppercase">
          Selective Disclosure Architecture (Zcash Shielded Pool)
        </h4>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Autonomous AI agent fleets settle via shielded Orchard/Sapling transactions to prevent competitor surveillance of vendor relationships and spend velocity. Viewing keys enable deterministic auditability without compromising on-chain confidentiality.
        </p>
        <p className="font-mono text-[10px] text-zinc-500 pt-0.5">
          TAM Projection: Autonomous agent commerce forecast at $752.7B by 2029 (Gartner).
        </p>
      </div>
    </div>
  );
}
