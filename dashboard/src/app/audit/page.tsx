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
    // Simple CSV export
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
    <div className="max-w-6xl mx-auto flex flex-col h-full pb-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Audit Log</h1>
          <p className="text-slate-400">Comprehensive record of all policy checks and decisions.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={exportCSV}
          className="border-slate-700 hover:bg-slate-800 text-slate-200"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex-1">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-950">
              <TableRow className="border-slate-800 hover:bg-slate-950">
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="text-slate-400 font-semibold">Date</TableHead>
                <TableHead className="text-slate-400 font-semibold">Agent</TableHead>
                <TableHead className="text-slate-400 font-semibold">Vendor</TableHead>
                <TableHead className="text-slate-400 font-semibold text-right">Amount (USD)</TableHead>
                <TableHead className="text-slate-400 font-semibold text-center">Status</TableHead>
                <TableHead className="text-slate-400 font-semibold">Transaction ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow className="border-slate-800">
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                    No audit logs found.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <TableRow 
                      className={`border-slate-800/50 hover:bg-slate-800/30 cursor-pointer ${expandedId === log.id ? 'bg-slate-800/30' : ''}`}
                      onClick={() => toggleExpand(log.id)}
                    >
                      <TableCell>
                        {expandedId === log.id ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </TableCell>
                      <TableCell className="text-slate-300 text-sm whitespace-nowrap">
                        {format(new Date(log.requested_at), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="font-medium text-slate-200">{log.agent_name}</TableCell>
                      <TableCell className="text-slate-300">{log.vendor_name}</TableCell>
                      <TableCell className="text-right font-medium text-slate-200">
                        ${log.amount_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={log.status} />
                      </TableCell>
                      <TableCell>
                        {log.txid ? (
                          <a 
                            href={`https://zcashblockexplorer.com/transactions/${log.txid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-xs truncate max-w-[120px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {log.txid.substring(0, 8)}...{log.txid.substring(log.txid.length - 8)}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-600 text-xs">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                    
                    {expandedId === log.id && (
                      <TableRow className="border-slate-800/50 bg-slate-950/50 hover:bg-slate-950/50">
                        <TableCell colSpan={7} className="p-0">
                          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 border-l-4 border-indigo-500 ml-4 my-4">
                            <div>
                              <h4 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">JEV Policy Analysis</h4>
                              <div className="space-y-3">
                                <div>
                                  <span className="text-xs text-slate-500 block mb-1">Risk Score</span>
                                  <div className="flex items-center gap-3">
                                    <span className={`text-lg font-bold ${log.jev_risk_score >= 3.5 ? 'text-red-400' : log.jev_risk_score >= 2 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                      {log.jev_risk_score.toFixed(1)} / 5.0
                                    </span>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-xs text-slate-500 block mb-1">Route Decision</span>
                                  <span className="text-sm text-slate-200 font-mono bg-slate-800 px-2 py-1 rounded">
                                    {log.route_decision || "N/A"}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-xs text-slate-500 block mb-1">Reasoning</span>
                                  <p className="text-sm text-slate-300 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 leading-relaxed">
                                    {log.jev_reasoning || "Standard policy check completed."}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">Transaction Details</h4>
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <span className="text-xs text-slate-500 block mb-1">Payment ID</span>
                                    <span className="text-sm text-slate-300 font-mono text-xs truncate block">{log.id}</span>
                                  </div>
                                  <div>
                                    <span className="text-xs text-slate-500 block mb-1">ZEC Amount</span>
                                    <span className="text-sm text-slate-200">{log.amount_zec.toFixed(8)} ZEC</span>
                                  </div>
                                </div>
                                {log.business_purpose && (
                                  <div>
                                    <span className="text-xs text-slate-500 block mb-1">Business Purpose</span>
                                    <span className="text-sm text-slate-300">{log.business_purpose}</span>
                                  </div>
                                )}
                                {log.memo && (
                                  <div>
                                    <span className="text-xs text-slate-500 block mb-1">Encrypted Memo</span>
                                    <div className="bg-slate-900 p-2 rounded border border-slate-800 font-mono text-xs text-slate-400 break-all">
                                      {log.memo}
                                    </div>
                                  </div>
                                )}
                              </div>
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
