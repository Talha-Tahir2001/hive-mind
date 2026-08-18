import {
  IconWriting,
  IconBook,
  IconBrain,
  IconArrowRight,
} from "@tabler/icons-react";

const steps = [
  {
    icon: IconWriting,
    title: "Agents write memories",
    description:
      "Every finding, critique, fix, and deployment plan is written to shared memory in CockroachDB — with vector embeddings for semantic search.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: IconBook,
    title: "Agents read memories",
    description:
      "Before acting, each agent searches shared memory for relevant context — past code, review patterns, deployment history, and injected issues.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: IconBrain,
    title: "The hive compounds knowledge",
    description:
      "Memory persists across runs, restarts, and failures. The hive gets smarter every day. What one agent learns, all agents benefit from.",
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
];

export function HowItWorks() {
  return (
    <section className="border-b py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            How it works
          </h2>
          <p className="mt-2 text-muted-foreground">
            Three steps. Persistent memory. Emergent intelligence.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              <div className="flex flex-col items-center text-center">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${step.bg}`}
                >
                  <step.icon className={`h-6 w-6 ${step.color}`} />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>

              {/* Arrow between steps (desktop only) */}
              {index < steps.length - 1 && (
                <div className="absolute -right-4 top-6 hidden md:block">
                  <IconArrowRight className="h-4 w-4 text-muted-foreground/50" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}