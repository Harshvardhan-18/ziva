"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, CheckSquare, FileText, Eye, ShieldCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { name: "Live Feed", href: "/", icon: Activity },
  { name: "Approvals", href: "/approvals", icon: CheckSquare },
  { name: "Audit Log", href: "/audit", icon: FileText },
  { name: "Auditor Demo", href: "/auditor", icon: Eye },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border bg-black flex flex-col justify-between shrink-0 select-none">
      <div>
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded border border-zinc-700 bg-zinc-900 flex items-center justify-center">
              <ShieldCheck className="size-4 text-white" strokeWidth={2} />
            </div>
            <div>
              <div className="font-mono text-sm font-semibold tracking-tight text-white">
                ZIVA
              </div>
              <div className="font-mono text-[9px] tracking-widest text-zinc-500 uppercase">
                Spend Protocol
              </div>
            </div>
          </div>
          <span className="font-mono text-[9px] tracking-wide text-zinc-400 border border-zinc-800 px-1.5 py-0.5 rounded">
            TESTNET
          </span>
        </div>

        <Separator />

        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded text-xs transition-colors ${
                  isActive
                    ? "bg-zinc-900 text-white font-medium border border-zinc-800"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-950 font-normal"
                }`}
              >
                <item.icon className="size-4 shrink-0" strokeWidth={1.75} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div>
        <Separator />
        <div className="p-4 space-y-1.5 font-mono text-[10px] text-zinc-500">
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">NETWORK</span>
            <span className="text-zinc-300">Zcash Testnet</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">CONSENSUS</span>
            <span className="text-zinc-400">NU6.3 (0x77190ad9)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">SETTLEMENT</span>
            <span className="text-zinc-300">Shielded (Orchard)</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
