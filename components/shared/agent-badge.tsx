import { IconCode, IconSearch, IconRocket } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import type { AgentType } from "@/lib/memory/types";

const agentConfig: Record<
  AgentType,
  { label: string; icon: typeof IconCode; color: string; bg: string }
> = {
  coder: {
    label: "Coder",
    icon: IconCode,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  reviewer: {
    label: "Reviewer",
    icon: IconSearch,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  deployer: {
    label: "Deployer",
    icon: IconRocket,
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
};

export function AgentBadge({
  type,
  showIcon = true,
}: {
  type: AgentType;
  showIcon?: boolean;
}) {
  const config = agentConfig[type];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`gap-1 text-[10px] ${config.bg} ${config.color}`}>
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}

export function AgentIcon({ type }: { type: AgentType }) {
  const config = agentConfig[type];
  const Icon = config.icon;
  return (
    <div className={`flex h-7 w-7 items-center justify-center rounded-full ${config.bg}`}>
      <Icon className={`h-3.5 w-3.5 ${config.color}`} />
    </div>
  );
}