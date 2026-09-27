"use client";

import { useEffect, useState } from "react";
import { PaymentRequest } from "@/lib/types";
import { getPendingApprovals, approvePayment, rejectPayment } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { JevScoreDisplay } from "@/components/JevScoreDisplay";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<PaymentRequest[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRequest | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadApprovals();
  }, []);

  async function loadApprovals() {
    const data = await getPendingApprovals();
    setApprovals(data.filter(p => p.status === "jev_escalated" || p.status === "human_approved"));
  }

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
      // Remove from list
      setApprovals(approvals.filter(p => p.id !== selectedPayment.id));
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
      setSelectedPayment(null);
      setActionType(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-full pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Pending Approvals Queue</h1>
        <p className="text-slate-400">Review transactions escalated by JEV policy checks.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex-1">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-950">
              <TableRow className="border-slate-800 hover:bg-slate-950">
                <TableHead className="text-slate-400 font-semibold w-[200px]">Agent & Vendor</TableHead>
                <TableHead className="text-slate-400 font-semibold text-right">Amount</TableHead>
                <TableHead className="text-slate-400 font-semibold text-center w-[150px]">Risk Score</TableHead>
                <TableHead className="text-slate-400 font-semibold w-[250px]">JEV Reasoning</TableHead>
                <TableHead className="text-slate-400 font-semibold text-right">Requested</TableHead>
                <TableHead className="text-slate-400 font-semibold text-center w-[180px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvals.length === 0 ? (
                <TableRow className="border-slate-800">
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                    No pending approvals. Queue is clear!
                  </TableCell>
                </TableRow>
              ) : (
                approvals.map((payment) => (
                  <TableRow key={payment.id} className="border-slate-800/50 hover:bg-slate-800/50">
                    <TableCell>
                      <div className="font-semibold text-slate-200">{payment.agent_name}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <span className="truncate max-w-[150px]">→ {payment.vendor_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-bold text-slate-200">
                        ${payment.amount_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-slate-400">
                        {payment.amount_zec.toFixed(4)} ZEC
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <JevScoreDisplay score={payment.jev_risk_score} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-md text-xs text-amber-200/90 line-clamp-3">
                        <AlertCircle className="w-3 h-3 inline mr-1 text-amber-500" />
                        {payment.jev_reasoning || "Escalated for manual review due to policy limits."}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm text-slate-400">
                      {formatDistanceToNow(new Date(payment.requested_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400 h-8 px-3"
                          onClick={() => handleActionClick(payment, "approve")}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-400 h-8 px-3"
                          onClick={() => handleActionClick(payment, "reject")}
                        >
                          <XCircle className="w-4 h-4 mr-1" /> Reject
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
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle>Confirm {actionType === "approve" ? "Approval" : "Rejection"}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to {actionType} this payment request?
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="bg-slate-950 p-4 rounded-lg my-4 border border-slate-800">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 block text-xs mb-1">Agent</span>
                  <span className="font-medium text-slate-300">{selectedPayment.agent_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs mb-1">Vendor</span>
                  <span className="font-medium text-slate-300">{selectedPayment.vendor_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs mb-1">Amount</span>
                  <span className="font-bold text-slate-200">${selectedPayment.amount_usd.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs mb-1">Risk Score</span>
                  <span className="font-medium text-amber-400">{selectedPayment.jev_risk_score}/5.0</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setSelectedPayment(null)}
              disabled={isProcessing}
              className="border-slate-700 hover:bg-slate-800 text-slate-300"
            >
              Cancel
            </Button>
            <Button 
              className={actionType === "approve" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
              onClick={confirmAction}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : `Confirm ${actionType}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
