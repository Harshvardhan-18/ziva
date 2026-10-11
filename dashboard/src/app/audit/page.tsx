"use client";

import React, { useEffect, useState } from "react";
import { PaymentRequest } from "@/lib/types";
import { getAuditLog } from "@/lib/api";
import { format } from "date-fns";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AuditLogPage() {
  const [logs, setLogs] = useState<PaymentRequest[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    getAuditLog().then(setLogs);
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const exportCSV = () => {
    const headers = ["ID", "Agent", "Vendor", "Amount USD", "Amount ZEC", "Status", "Risk Score", "Requested At", "TxID"];
    const csvContent = logs.map(p => 
      `${p.id},${p.agent_name},${p.vendor_name},${p.amount_usd},${p.amount_zec},${p.status},${p.jev_risk_score},${p.requested_at},${p.txid || ""}`
    ).join("\n");
    const blob = new Blob([`${headers.join(",")}\n${csvContent}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ziva_audit_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-full p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Audit Log
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Deterministic compliance ledger recording all policy engine evaluations and settlement states.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={exportCSV}
          className="border-border hover:bg-zinc-900 text-zinc-300 font-mono text-xs h-8 px-3"
        >
          <Download className="size-3.5 mr-1.5" />
          Export CSV
        </Button>
      </div>

      <div className="border border-border bg-black rounded-lg overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <Table>
            <TableHeader className="bg-zinc-950 border-b border-border">
              <TableRow className="border-border hover:bg-zinc-950">
                <TableHead className="w-[36px]"></TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">Date</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">Agent</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">Vendor</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 text-right">Amount (USD)</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 text-center">Status</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">Transaction ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow className="border-border">
                  <TableCell colSpan={7} className="text-center py-16 text-xs font-mono text-zinc-500">
                    No records found in audit database.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <TableRow 
                      className={`border-border hover:bg-zinc-950/60 cursor-pointer transition-colors ${expandedId === log.id ? 'bg-zinc-950' : ''}`}
                      onClick={() => toggleExpand(log.id)}
                    >
                      <TableCell className="w-[36px] px-2 text-center">
                        {expandedId === log.id ? (
                          <ChevronUp className="size-3.5 text-zinc-400 mx-auto" />
                        ) : (
                          <ChevronDown className="size-3.5 text-zinc-500 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                        {format(new Date(log.requested_at), "yyyy-MM-dd HH:mm")}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-medium text-white">
                        {log.agent_name}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-300">
                        {log.vendor_name}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold text-white">
                        ${log.amount_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={log.status} />
                      </TableCell>
                      <TableCell>
                        {log.txid ? (
                          <a 
                            href={`https://testnet.zec.rocks/tx/${log.txid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-[11px] text-zinc-300 hover:text-white underline decoration-zinc-700 underline-offset-2 inline-flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span>{log.txid.substring(0, 8)}...{log.txid.substring(log.txid.length - 6)}</span>
                            <ExternalLink className="size-3 text-zinc-500" />
                          </a>
                        ) : (
                          <span className="font-mono text-xs text-zinc-600">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                    
                    {expandedId === log.id && (
                      <TableRow className="border-border bg-black hover:bg-black">
                        <TableCell colSpan={7} className="p-0">
                          <div className="p-5 border-y border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-950/80">
                            <div className="space-y-3">
                              <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 border-b border-zinc-800 pb-1.5">
                                JEV POLICY VERDICT
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                                <div>
                                  <span className="text-zinc-500 block text-[10px]">RISK SCORE</span>
                                  <span className="text-white font-medium">{log.jev_risk_score.toFixed(1)} / 5.0</span>
                                </div>
                                <div>
                                  <span className="text-zinc-500 block text-[10px]">ROUTE DECISION</span>
                                  <span className="text-zinc-300 uppercase">{log.route_decision || "N/A"}</span>
                                </div>
                              </div>
                              <div>
                                <span className="text-zinc-500 block text-[10px] font-mono mb-1">EVALUATION SUMMARY</span>
                                <div className="text-xs text-zinc-300 bg-black p-3 rounded border border-border leading-relaxed font-mono">
                                  {log.jev_reasoning || "All 4 deterministic policy checks passed (Allowlist, Quote Tolerance, Budget, Schedule)."}
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 border-b border-zinc-800 pb-1.5">
                                TRANSACTION & MEMO
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                                <div>
                                  <span className="text-zinc-500 block text-[10px]">PAYMENT ID</span>
                                  <span className="text-zinc-400 text-[11px] truncate block">{log.id}</span>
                                </div>
                                <div>
                                  <span className="text-zinc-500 block text-[10px]">ZEC SETTLED</span>
                                  <span className="text-white font-semibold">{log.amount_zec.toFixed(6)} ZEC</span>
                                </div>
                              </div>
                              {log.memo && (
                                <div>
                                  <span className="text-zinc-500 block text-[10px] font-mono mb-1">SHIELDED MEMO</span>
                                  <div className="bg-black p-2.5 rounded border border-border font-mono text-[11px] text-zinc-300 break-all">
                                    {log.memo}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
