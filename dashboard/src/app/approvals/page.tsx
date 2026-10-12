"use client";

import { useEffect, useState, useCallback } from "react";
import { PaymentRequest } from "@/lib/types";
import { approvePayment, rejectPayment, mockPendingApprovals, normalizePayment } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { JevScoreDisplay } from "@/components/JevScoreDisplay";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowRight, RefreshCw } from "lucide-react";

export const dynamic = "force-dynamic";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<PaymentRequest[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRequest | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadApprovals = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch all jev_escalated payments
      const res = await fetch(`${API_URL}/payments/?status=jev_escalated`, {
        cache: "no-store",
      });
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw) && raw.length > 0) {
          const normalized = raw.map(normalizePayment);
          setApprovals(normalized);
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // fall through to mock
    }
    // Fallback: always show mock data so demo is never empty
    setApprovals(mockPendingApprovals());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadApprovals();
    // Poll every 10 seconds so newly escalated payments appear automatically
    const interval = setInterval(loadApprovals, 10000);
    return () => clearInterval(interval);
  }, [loadApprovals]);

  const handleActionClick = (payment: PaymentRequest, type: "approve" | "reject") => {
    setSelectedPayment(payment);
    setActionType(type);
  };

  const confirmAction = async () => {
    if (!selectedPayment || !actionType) return;
    setIsProcessing(true);
    try {
      if (actionType === "approve") {
        await approvePayment(selectedPayment.id);
      } else {
        await rejectPayment(selectedPayment.id);
      }
      // Remove from local list immediately for snappy UX
      setApprovals((prev) => prev.filter((p) => p.id !== selectedPayment.id));
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
      setSelectedPayment(null);
      setActionType(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-full p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Pending Approvals Queue
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Dual-authorization review for payments escalated by deterministic policy thresholds or JEV risk scores.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadApprovals}
          disabled={isLoading}
          className="border-border hover:bg-zinc-900 text-zinc-300 font-mono text-xs h-8 px-3"
        >
          <RefreshCw className={`size-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="border border-border bg-black rounded-lg overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <Table>
            <TableHeader className="bg-zinc-950 border-b border-border">
              <TableRow className="border-border hover:bg-zinc-950">
                <TableHead className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                  Agent & Vendor
                </TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 text-right">
                  Amount
                </TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 text-center w-[130px]">
                  Risk Score
                </TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 max-w-[280px]">
                  JEV Policy Reasoning
                </TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 text-right w-[120px]">
                  Requested
                </TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 text-center w-[160px]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvals.length === 0 ? (
                <TableRow className="border-border">
                  <TableCell colSpan={6} className="text-center py-16 text-xs font-mono text-zinc-500">
                    {isLoading ? "Loading..." : "No transactions pending review. Queue is clear."}
                  </TableCell>
                </TableRow>
              ) : (
                approvals.map((payment) => (
                  <TableRow key={payment.id} className="border-border hover:bg-zinc-950/60">
                    <TableCell>
                      <div className="font-mono text-xs font-semibold text-white">
                        {payment.agent_name}
                      </div>
                      <div className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                        <ArrowRight className="size-2.5 text-zinc-600" />
                        <span className="truncate max-w-[160px]">{payment.vendor_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-mono text-xs font-semibold text-white">
                        ${payment.amount_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div className="font-mono text-[10px] text-zinc-500">
                        {payment.amount_zec.toFixed(4)} ZEC
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <JevScoreDisplay score={payment.jev_risk_score} />
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[280px]">
                      <div className="text-xs text-zinc-300 border border-zinc-800 bg-zinc-950 p-2 rounded leading-relaxed line-clamp-2">
                        {payment.jev_reasoning || "Escalated for human co-signing due to anomalous amount or risk tier."}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-[11px] text-zinc-500">
                      {formatDistanceToNow(new Date(payment.requested_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-white text-black hover:bg-zinc-200 font-mono text-[11px] h-7 px-2.5 rounded"
                          onClick={() => handleActionClick(payment, "approve")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white font-mono text-[11px] h-7 px-2.5 rounded"
                          onClick={() => handleActionClick(payment, "reject")}
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!selectedPayment} onOpenChange={(open) => !open && !isProcessing && setSelectedPayment(null)}>
        <DialogContent className="bg-zinc-950 border-border text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm uppercase tracking-wider text-white">
              Confirm {actionType === "approve" ? "Execution" : "Rejection"}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              {actionType === "approve"
                ? "Authorizing will broadcast the transaction to Zcash testnet for shielded settlement."
                : "Rejecting will terminate this spend request and record a denial in the audit log."}
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="border border-border bg-black p-3.5 rounded my-2 font-mono text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">AGENT</span>
                <span className="text-white">{selectedPayment.agent_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">VENDOR</span>
                <span className="text-white">{selectedPayment.vendor_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">AMOUNT</span>
                <span className="text-white font-semibold">
                  ${selectedPayment.amount_usd.toFixed(2)} ({selectedPayment.amount_zec.toFixed(4)} ZEC)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">JEV SCORE</span>
                <span className="text-zinc-300">{selectedPayment.jev_risk_score.toFixed(1)} / 5.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">ANOMALY P</span>
                <span className="text-zinc-300">
                  {selectedPayment.anomaly_probability
                    ? `${(selectedPayment.anomaly_probability * 100).toFixed(0)}%`
                    : "—"}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedPayment(null)}
              disabled={isProcessing}
              className="border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-mono text-xs h-8"
            >
              Cancel
            </Button>
            <Button
              className={
                actionType === "approve"
                  ? "bg-white text-black hover:bg-zinc-200 font-mono text-xs h-8"
                  : "bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-700 font-mono text-xs h-8"
              }
              onClick={confirmAction}
              disabled={isProcessing}
            >
              {isProcessing ? "Broadcasting..." : `Confirm ${actionType === "approve" ? "Approval" : "Rejection"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
