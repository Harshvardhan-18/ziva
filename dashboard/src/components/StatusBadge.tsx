import { Badge } from "@/components/ui/badge";
import { PaymentStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: PaymentStatus }) {
  let colorClass = "bg-gray-500 hover:bg-gray-600";
  const label = status.replace("_", " ").toUpperCase();

  switch (status) {
    case "auto_approved":
      colorClass = "bg-emerald-500 hover:bg-emerald-600 text-white";
      break;
    case "jev_escalated":
    case "human_approved":
      colorClass = "bg-amber-500 hover:bg-amber-600 text-white";
      break;
    case "blocked":
    case "failed":
      colorClass = "bg-red-500 hover:bg-red-600 text-white";
      break;
    case "broadcasting":
    case "confirmed":
      colorClass = "bg-blue-500 hover:bg-blue-600 text-white";
      break;
    case "pending":
      colorClass = "bg-gray-500 hover:bg-gray-600 text-white";
      break;
  }

  return (
    <Badge className={`${colorClass} whitespace-nowrap`}>
      {label}
    </Badge>
  );
}
