import { PaymentRequest } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { JevScoreDisplay } from "./JevScoreDisplay";
import { formatDistanceToNow } from "date-fns";
import { Bot, Building2 } from "lucide-react";

export function PaymentCard({ payment }: { payment: PaymentRequest }) {
  return (
    <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-slate-700 p-2 rounded-full">
            <Bot className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-200">{payment.agent_name}</h3>
            <span className="text-xs text-slate-400">
              {formatDistanceToNow(new Date(payment.requested_at), { addSuffix: true })}
            </span>
          </div>
        </div>
        <StatusBadge status={payment.status} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex flex-col">
          <span className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <Building2 className="w-3 h-3" /> Vendor
          </span>
          <span className="text-sm font-medium text-slate-300">{payment.vendor_name}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-slate-500 mb-1">Amount</span>
          <span className="text-sm font-bold text-slate-200">
            ${payment.amount_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-slate-400">{payment.amount_zec.toFixed(4)} ZEC</span>
        </div>
      </div>

      <div className="border-t border-slate-700 pt-4 flex items-center justify-between">
        <JevScoreDisplay score={payment.jev_risk_score} />
        {payment.route_decision && (
          <div className="text-right">
            <span className="text-xs text-slate-500 block mb-1">Route Decision</span>
            <span className="text-xs font-medium text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded-md">
              {payment.route_decision.replace(/_/g, " ")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
