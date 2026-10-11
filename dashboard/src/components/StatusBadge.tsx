import { Badge } from "@/components/ui/badge";
import { PaymentStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: PaymentStatus }) {
  switch (status) {
    case "auto_approved":
    case "confirmed":
      return (
        <Badge
          variant="outline"
          className="font-mono text-[10px] tracking-wider border-zinc-700 bg-zinc-900 text-zinc-100 gap-1.5 py-0.5 px-2"
        >
          <span className="size-1.5 rounded-full bg-white shrink-0" />
          CONFIRMED
        </Badge>
      );
    case "broadcasting":
      return (
        <Badge className="font-mono text-[10px] tracking-wider bg-white text-black hover:bg-zinc-200 gap-1.5 py-0.5 px-2 font-medium">
          <span className="size-1.5 rounded-full bg-black shrink-0 animate-pulse" />
          BROADCASTING
        </Badge>
      );
    case "jev_escalated":
      return (
        <Badge
          variant="outline"
          className="font-mono text-[10px] tracking-wider border-zinc-600 bg-zinc-900 text-zinc-200 gap-1.5 py-0.5 px-2"
        >
          <span className="size-1.5 rounded-full border border-white shrink-0" />
          ESCALATED
        </Badge>
      );
    case "human_approved":
      return (
        <Badge
          variant="outline"
          className="font-mono text-[10px] tracking-wider border-zinc-700 bg-zinc-900 text-zinc-200 gap-1.5 py-0.5 px-2"
        >
          <span className="size-1.5 rounded-full bg-zinc-400 shrink-0" />
          REVIEWED
        </Badge>
      );
    case "blocked":
    case "failed":
      return (
        <Badge
          variant="outline"
          className="font-mono text-[10px] tracking-wider border-zinc-800 bg-zinc-950 text-zinc-400 gap-1 py-0.5 px-2"
        >
          <span className="text-zinc-500 font-mono text-[10px]">✕</span>
          BLOCKED
        </Badge>
      );
    case "pending":
    default:
      return (
        <Badge
          variant="outline"
          className="font-mono text-[10px] tracking-wider border-zinc-800 bg-zinc-950 text-zinc-400 py-0.5 px-2"
        >
          PENDING
        </Badge>
      );
  }
}
