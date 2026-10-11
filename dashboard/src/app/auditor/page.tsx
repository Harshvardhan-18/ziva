"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Key, EyeOff, Eye, Lock, ExternalLink } from "lucide-react";
import { PrivacyBanner } from "@/components/PrivacyBanner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default function AuditorPage() {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-full p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          Selective Disclosure Demo
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Counterparty confidentiality on-chain with selective auditability via Zcash viewing keys.
        </p>
      </div>

      <PrivacyBanner />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Public Observer View */}
        <Card className="bg-zinc-950 border-border flex flex-col justify-between">
          <div>
            <CardHeader className="p-4 border-b border-border bg-black">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <EyeOff className="size-4 text-zinc-500" strokeWidth={1.75} />
                  <CardTitle className="font-mono text-xs uppercase tracking-wider text-zinc-300">
                    Public Observer View
                  </CardTitle>
                </div>
                <Badge variant="outline" className="font-mono text-[9px] border-zinc-800 text-zinc-500 uppercase">
                  ON-CHAIN
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="p-5 space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 block uppercase">TRANSACTION HASH</span>
                <a 
                  href="https://testnet.zec.rocks/tx/be88b650ad803c69452f0fc34656509dd8813abad5ec9cf13218836615b58ba2" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-zinc-300 hover:text-white underline decoration-zinc-700 underline-offset-2 flex items-center gap-1 text-[11px]"
                >
                  be88b650ad803c69452f0fc34656509dd8813abad5ec9cf13218836615b58ba2
                  <ExternalLink className="size-3 text-zinc-500" />
                </a>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 block uppercase">SENDER ADDRESS</span>
                <div className="bg-black p-2 rounded border border-border text-zinc-500 select-none text-[11px]">
                  ••••••••••••••••••••••••••••••••••••••••••••••••
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 block uppercase">RECIPIENT ADDRESS</span>
                <div className="bg-black p-2 rounded border border-border text-zinc-500 select-none text-[11px]">
                  ••••••••••••••••••••••••••••••••••••••••••••••••
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 block uppercase">SETTLEMENT AMOUNT</span>
                <div className="bg-black p-2 rounded border border-border text-zinc-500 select-none text-[11px]">
                  CONFIDENTIAL (Shielded Orchard Pool)
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 block uppercase">MEMO CIPHERTEXT</span>
                <div className="bg-black p-2 rounded border border-border text-zinc-600 text-[10px] break-all select-none">
                  ae4b29c98f104d58a1200df...[512 bytes encrypted blob]...8a29b4e
                </div>
              </div>
            </CardContent>
          </div>

          <div className="p-4 border-t border-border bg-black/60 text-[11px] text-zinc-500 leading-relaxed">
            To an external blockchain observer, all counterparty identities, spend amounts, and memos are cryptographically concealed inside the shielded pool.
          </div>
        </Card>

        {/* Authorized Auditor View */}
        <Card className="bg-zinc-950 border-border flex flex-col justify-between relative overflow-hidden">
          {!isRevealed && (
            <div className="absolute inset-0 z-20 bg-black/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="size-10 rounded border border-zinc-800 bg-zinc-900 flex items-center justify-center">
                <Key className="size-5 text-white" strokeWidth={1.75} />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="font-mono text-sm font-semibold text-white uppercase tracking-wider">
                  Auditor Viewing Key Required
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Viewing keys enable read-only selective disclosure for compliance and tax audits without exposing wallet spend authority.
                </p>
              </div>
              <Button 
                onClick={() => setIsRevealed(true)}
                className="bg-white text-black hover:bg-zinc-200 font-mono text-xs h-8 px-4 font-medium"
              >
                <Key className="size-3.5 mr-1.5" />
                Authorize Viewing Key
              </Button>
            </div>
          )}

          <div>
            <CardHeader className="p-4 border-b border-border bg-black">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="size-4 text-white" strokeWidth={1.75} />
                  <CardTitle className="font-mono text-xs uppercase tracking-wider text-white">
                    Authorized Auditor View
                  </CardTitle>
                </div>
                <Badge className="font-mono text-[9px] bg-white text-black uppercase font-medium">
                  DECRYPTED
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="p-5 space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 block uppercase">TRANSACTION HASH</span>
                <span className="text-zinc-300 text-[11px] block truncate">
                  be88b650ad803c69452f0fc34656509dd8813abad5ec9cf13218836615b58ba2
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 block uppercase">SENDER AGENT</span>
                  <div className="text-white font-medium text-xs">
                    DevOps_Fleet_Alpha
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 block uppercase">RECIPIENT VENDOR</span>
                  <div className="text-white font-medium text-xs">
                    CloudServices Inc.
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 block uppercase">DECRYPTED AMOUNT</span>
                <div className="text-white font-bold text-base">
                  $4,500.00 USD <span className="text-xs font-normal text-zinc-400">/ 102.5000 ZEC</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 block uppercase">DECRYPTED MEMO & PURPOSE</span>
                <div className="bg-black p-3 rounded border border-border text-zinc-300 text-xs leading-relaxed">
                  &quot;Payment for Q3 cloud infrastructure usage. Approved by JEV Policy #42. Inv: INV-2026-8891.&quot;
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 block uppercase">POLICY ENGINE VALIDATION</span>
                <div className="bg-black p-2 rounded border border-border text-[11px] text-zinc-400">
                  Allowlist: OK • Quote Tolerance: 0% • Budget Remaining: $5,500.00 • Schedule: Valid
                </div>
              </div>
            </CardContent>
          </div>

          <div className="p-3 border-t border-border bg-black/60 flex items-center justify-between">
            <span className="font-mono text-[10px] text-zinc-500">
              VIEWING KEY: zxviewtestsapling1q8z...
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsRevealed(false)} 
              className="border-border hover:bg-zinc-900 text-zinc-400 hover:text-white font-mono text-[10px] h-7 px-2.5"
            >
              <Lock className="size-3 mr-1" /> Reset Key
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
