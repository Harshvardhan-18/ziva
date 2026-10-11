import { PaymentRequest } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { JevScoreDisplay } from "./JevScoreDisplay";
import { formatDistanceToNow } from "date-fns";
import { Bot, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function PaymentCard({ payment }: { payment: PaymentRequest }) {
  return (
    <Card className="bg-zinc-950 border-border hover:border-zinc-700 transition-colors rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded border border-zinc-800 bg-zinc-900 flex items-center justify-center">
            <Bot className="size-3.5 text-zinc-300" strokeWidth={1.75} />
          </div>
          <div>
            <span className="font-mono text-xs font-medium text-white">
              {payment.agent_name}
            </span>
            <span className="font-mono text-[10px] text-zinc-500 ml-2">
              {formatDistanceToNow(new Date(payment.requested_at), { addSuffix: true })}
            </span>
          </div>
        </div>
        <StatusBadge status={payment.status} />
      </div>

      <div className="grid grid-cols-2 gap-4 my-2 text-xs">
        <div>
          <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5 flex items-center gap-1">
            <span>VENDOR</span>
            <ArrowRight className="size-2.5 text-zinc-600" />
          </div>
          <div className="font-medium text-zinc-200 truncate">
            {payment.vendor_name}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">
            AMOUNT
          </div>
          <div className="font-mono font-semibold text-white">
            ${payment.amount_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="font-mono text-[10px] text-zinc-400">
            {payment.amount_zec.toFixed(4)} ZEC
          </div>
        </div>
      </div>

      <Separator className="my-3 bg-zinc-800/80" />

      <div className="flex items-center justify-between pt-0.5">
        <JevScoreDisplay score={payment.jev_risk_score} />
        {payment.route_decision && (
          <div className="text-right">
            <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400 border border-zinc-800 bg-zinc-900/60 px-2 py-0.5 rounded">
              {payment.route_decision.replace(/_/g, " ")}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
