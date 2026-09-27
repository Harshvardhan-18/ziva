"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Key, EyeOff, Eye, Lock, ShieldCheck, ExternalLink } from "lucide-react";
import { PrivacyBanner } from "@/components/PrivacyBanner";

export const dynamic = "force-dynamic";

export default function AuditorPage() {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-full pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Selective Disclosure Demo</h1>
        <p className="text-slate-400">Demonstrating Zcash shielded transactions with viewing keys.</p>
      </div>

      <PrivacyBanner />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
        {/* Public View */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-lg relative">
          <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <EyeOff className="w-5 h-5 text-slate-500" />
              Public Observer View
            </div>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded">Default</span>
          </div>
          
          <div className="p-6 flex-1 flex flex-col">
            <div className="bg-slate-950 rounded-lg p-4 border border-slate-800/50 mb-4">
              <div className="flex items-center gap-2 mb-4 text-slate-400">
                <Lock className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-semibold uppercase tracking-wider text-emerald-500">Shielded Transaction</span>
              </div>
              
              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-slate-500 block mb-1">TxID</span>
                  <a href="#" className="text-indigo-400 hover:underline flex items-center gap-1">
                    d9e8b7c6a5f4...3a2b1c0d9e8f
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Sender</span>
                  <div className="text-slate-600 font-mono bg-slate-900 p-2 rounded blur-[2px] select-none">
                    ztestsapling1...redacted...
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Recipient</span>
                  <div className="text-slate-600 font-mono bg-slate-900 p-2 rounded blur-[2px] select-none">
                    ztestsapling1...redacted...
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Amount</span>
                  <div className="text-slate-600 font-mono bg-slate-900 p-2 rounded blur-[2px] select-none">
                    Hidden (0 ZEC public)
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Memo</span>
                  <div className="text-slate-600 font-mono bg-slate-900 p-2 rounded blur-[2px] select-none break-all">
                    f8a9b2...[encrypted blob]...4c3d
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-auto pt-4 text-center text-sm text-slate-500">
              <p>To the public, this transaction reveals nothing useful — only the transaction hash and fee.</p>
            </div>
          </div>
        </div>

        {/* Auditor View */}
        <div className={`border rounded-xl overflow-hidden flex flex-col shadow-lg transition-all duration-700 relative ${isRevealed ? 'bg-slate-900 border-indigo-500/50 shadow-indigo-500/10' : 'bg-slate-900/50 border-slate-800'}`}>
          {!isRevealed && (
            <div className="absolute inset-0 z-10 backdrop-blur-[2px] bg-slate-950/40 flex flex-col items-center justify-center p-6 text-center">
              <ShieldCheck className="w-16 h-16 text-slate-700 mb-4" />
              <h3 className="text-lg font-bold text-slate-300 mb-2">Auditor Access Required</h3>
              <p className="text-sm text-slate-500 mb-6">A viewing key is required to decrypt and view the details of this transaction.</p>
              <Button 
                onClick={() => setIsRevealed(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white group"
              >
                <Key className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                Reveal to Auditor
              </Button>
            </div>
          )}

          <div className="bg-indigo-950/30 p-4 border-b border-indigo-900/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-300 font-medium">
              <Eye className="w-5 h-5 text-indigo-400" />
              Authorized Auditor View
            </div>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded flex items-center gap-1">
              <Key className="w-3 h-3" /> Viewing Key Active
            </span>
          </div>
          
          <div className="p-6 flex-1 flex flex-col">
            <div className={`bg-slate-950 rounded-lg p-4 border border-slate-800 mb-4 transition-opacity duration-700 ${isRevealed ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold uppercase tracking-wider text-indigo-400">Decrypted Details</span>
              </div>
              
              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-slate-500 block mb-1">TxID</span>
                  <span className="text-slate-300 font-mono">d9e8b7c6a5f4...3a2b1c0d9e8f</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 block mb-1">Sender Agent</span>
                    <span className="text-slate-200 font-medium">ProcurementBot_Alpha</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Recipient Vendor</span>
                    <span className="text-slate-200 font-medium">CloudServices Inc.</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Amount</span>
                  <div className="text-xl font-bold text-emerald-400">
                    $4,500.00 <span className="text-sm text-slate-400 font-normal">/ 102.5 ZEC</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Business Purpose (Memo)</span>
                  <div className="text-slate-300 bg-slate-900 p-3 rounded border border-slate-800 leading-relaxed text-xs">
                    &quot;Payment for Q3 cloud infrastructure usage. Approved by JEV Policy #42. Inv: INV-2026-8891.&quot;
                  </div>
                </div>
              </div>
            </div>
            
            <div className={`mt-auto pt-4 text-center transition-opacity duration-700 ${isRevealed ? 'opacity-100' : 'opacity-0'}`}>
              <Button variant="ghost" size="sm" onClick={() => setIsRevealed(false)} className="text-slate-500 hover:text-slate-300">
                <Lock className="w-4 h-4 mr-2" /> Reset Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
