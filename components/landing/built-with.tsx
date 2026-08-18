import { IconBrandAws, IconBrandOpenai, IconServerBolt, IconDatabase } from "@tabler/icons-react";
import React from "react";

const technologies = [
  {
    name: "CockroachDB",
    description: "Distributed SQL with vector indexing",
    icon: IconDatabase,
  },
  {
    name: "Amazon Web Services",
    description: "S3, Bedrock, cloud infrastructure",
    icon: IconBrandAws,
  },
  {
    name: "OpenAI GPT-5.6",
    description: "Agent reasoning and code generation",
    icon: IconBrandOpenai,
  },
  {
    name: "MCP Server",
    description: "Direct agent ↔ database connection",
    icon: IconServerBolt,
  },
];

export function BuiltWith() {
  return (
    <section className="border-b py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Built on
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          {technologies.map((tech) => (
            <div
              key={tech.name}
              className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center"
            >
              <span className="text-3xl">
                {React.createElement(tech.icon, { size: 30 })}
              </span>
              <span className="text-sm font-semibold">{tech.name}</span>
              <span className="text-xs text-muted-foreground">
                {tech.description}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}