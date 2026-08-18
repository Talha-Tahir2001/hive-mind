import { Badge } from "@/components/ui/badge";
import type { AgentStatus } from "@/lib/memory/types";

const statusConfig: Record<
  AgentStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive"; className: string }
> = {
  idle: { label: "Idle", variant: "secondary", className: "" },
  thinking: { label: "Thinking", variant: "default", className: "animate-pulse" },
  reading: { label: "Reading", variant: "outline", className: "border-amber-500/30 text-amber-600" },
  writing: { label: "Writing", variant: "outline", className: "border-green-500/30 text-green-600" },
  done: { label: "Done", variant: "outline", className: "border-green-500/30 text-green-600" },
  error: { label: "Error", variant: "destructive", className: "" },
};

export function AgentStatusBadge({ status }: { status: AgentStatus }) {
  const config = statusConfig[status] ?? statusConfig.idle;
  return (
    <Badge variant={config.variant} className={`text-[10px] ${config.className}`}>
      {config.label}
    </Badge>
  );
}