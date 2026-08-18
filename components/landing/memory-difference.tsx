import { IconX, IconCheck } from "@tabler/icons-react";

const withoutHiveMind = [
  "Agents are isolated — no shared knowledge",
  "Memory is ephemeral — lost on restart",
  "Each agent repeats the same mistakes",
  "No cross-agent learning or collaboration",
  "Context window is the only memory",
];

const withHiveMind = [
  "Shared persistent memory across all agents",
  "Memory survives restarts, failures, and regions",
  "Agents learn from each other's past experiences",
  "Semantic search finds relevant knowledge instantly",
  "Knowledge compounds — the hive gets smarter daily",
];

export function MemoryDifference() {
  return (
    <section className="border-b py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            The memory difference
          </h2>
          <p className="mt-2 text-muted-foreground">
            Without shared persistent memory, agents are just stateless
            chatbots.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {/* Without HiveMind */}
          <div className="rounded-xl border bg-card p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-destructive">
              <IconX className="h-5 w-5" />
              Without shared memory
            </h3>
            <ul className="mt-4 space-y-3">
              {withoutHiveMind.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <IconX className="mt-0.5 h-4 w-4 shrink-0 text-destructive/50" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* With HiveMind */}
          <div className="rounded-xl border border-primary/30 bg-card p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
              <IconCheck className="h-5 w-5" />
              With HiveMind
            </h3>
            <ul className="mt-4 space-y-3">
              {withHiveMind.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm text-foreground"
                >
                  <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}