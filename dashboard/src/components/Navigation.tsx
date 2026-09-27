"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, CheckSquare, FileText, Eye, Shield } from "lucide-react";

const navItems = [
  { name: "Live Feed", href: "/", icon: Activity },
  { name: "Approvals", href: "/approvals", icon: CheckSquare },
  { name: "Audit Log", href: "/audit", icon: FileText },
  { name: "Auditor Demo", href: "/auditor", icon: Eye },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <Shield className="w-8 h-8 text-emerald-500" />
        <div>
          <h1 className="font-bold text-lg tracking-tight">ZIVA</h1>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Spend Control</p>
        </div>
      </div>
      <nav className="flex-1 py-6 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
        ZIVA Hackathon Demo
      </div>
    </div>
  );
}
