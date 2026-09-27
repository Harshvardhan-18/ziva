import { ShieldCheck } from "lucide-react";

export function PrivacyBanner() {
  return (
    <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-lg flex items-start gap-4 mb-6">
      <ShieldCheck className="text-blue-400 w-6 h-6 mt-1 flex-shrink-0" />
      <div>
        <h4 className="text-sm font-semibold text-slate-200 mb-1">
          Zcash-Powered Privacy Model
        </h4>
        <p className="text-xs text-slate-400 leading-relaxed">
          Zcash shielded transactions are private to external observers. Using a viewing key, authorized auditors can selectively decrypt transaction details — without exposing the key itself to the public. 
          <br />
          <span className="italic text-slate-500 mt-1 inline-block">One of $752.7B in projected AI agent transactions by 2029 (Gartner).</span>
        </p>
      </div>
    </div>
  );
}
