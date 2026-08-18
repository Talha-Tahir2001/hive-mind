import { Badge } from "@/components/ui/badge";
import type { MemoryType } from "@/lib/memory/types";

const typeConfig: Record<
  MemoryType,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive"; className: string }
> = {
  finding: {
    label: "Finding",
    variant: "outline",
    className: "border-blue-500/30 text-blue-600",
  },
  critique: {
    label: "Critique",
    variant: "outline",
    className: "border-amber-500/30 text-amber-600",
  },
  fix: {
    label: "Fix",
    variant: "outline",
    className: "border-green-500/30 text-green-600",
  },
  approval: {
    label: "Approved",
    variant: "outline",
    className: "border-green-500/30 text-green-600",
  },
  plan: {
    label: "Plan",
    variant: "outline",
    className: "border-purple-500/30 text-purple-600",
  },
  issue: {
    label: "Issue",
    variant: "outline",
    className: "border-red-500/30 text-red-600",
  },
  context: {
    label: "Context",
    variant: "secondary",
    className: "",
  },
};

export function MemoryTypeBadge({ type }: { type: MemoryType }) {
  const config = typeConfig[type] ?? typeConfig.context;
  return (
    <Badge variant={config.variant} className={`text-[10px] ${config.className}`}>
      {config.label}
    </Badge>
  );
}