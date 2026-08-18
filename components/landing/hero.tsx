import Link from "next/link";
import { SignUpButton, Show } from "@clerk/nextjs";
import {
  IconArrowRight,
  IconBrain,
  IconCode,
  IconSearch,
  IconRocket,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
            <IconBrain className="h-3 w-3" />
            CockroachDB × AWS Hackathon
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Agents that think together.
            <br />
            <span className="text-primary">
              Agents that remember together.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg lg:text-xl">
            When one agent learns, they all learn. HiveMind gives AI agents a
            shared, persistent memory — so knowledge compounds across agents,
            across runs, across time.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Show when="signed-out">
              <SignUpButton mode="modal">
                <Button size="lg" className="inline-flex items-center">
                  Launch Demo
                  <IconArrowRight className="h-4 w-4" />
                </Button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Button size="lg" className="inline-flex items-center">
                <Link href="/dashboard" className="inline-flex items-center">
                  Go to Dashboard
                  <IconArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </Show>
            <Button variant="outline" size="lg">
              <Link
                href="https://github.com/Talha-Tahir2001/hive-mind"
                target="_blank"
              >
                View on GitHub
              </Link>
            </Button>
          </div>
        </div>

        {/* Visual: Agent flow */}
        <div className="mx-auto mt-16 max-w-2xl">
          <div className="relative rounded-xl border bg-card p-6 shadow-sm sm:p-8">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              {/* Coder */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-blue-500/30 bg-blue-500/10">
                  <IconCode className="h-5 w-5 text-blue-500" />
                </div>
                <span className="text-xs font-medium">Coder</span>
                <span className="text-[10px] text-muted-foreground">
                  writes
                </span>
              </div>

              {/* Arrow */}
              <div className="hidden h-px flex-1 border-dashed border-muted-foreground/30 sm:block" />
              <div className="block h-px w-12 border-dashed border-muted-foreground/30 sm:hidden" />

              {/* Shared Memory */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10">
                  <IconBrain className="h-6 w-6 text-primary" />
                </div>
                <span className="text-xs font-semibold">Shared Memory</span>
                <span className="text-[10px] text-muted-foreground">
                  persists
                </span>
              </div>

              {/* Arrow */}
              <div className="hidden h-px flex-1 border-dashed border-muted-foreground/30 sm:block" />
              <div className="block h-px w-12 border-dashed border-muted-foreground/30 sm:hidden" />

              {/* Reviewer */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-500/30 bg-amber-500/10">
                  <IconSearch className="h-5 w-5 text-amber-500" />
                </div>
                <span className="text-xs font-medium">Reviewer</span>
                <span className="text-[10px] text-muted-foreground">
                  reads
                </span>
              </div>

              {/* Arrow */}
              <div className="hidden h-px flex-1 border-dashed border-muted-foreground/30 sm:block" />
              <div className="block h-px w-12 border-dashed border-muted-foreground/30 sm:hidden" />

              {/* Deployer */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-green-500/30 bg-green-500/10">
                  <IconRocket className="h-5 w-5 text-green-500" />
                </div>
                <span className="text-xs font-medium">Deployer</span>
                <span className="text-[10px] text-muted-foreground">
                  deploys
                </span>
              </div>
            </div>

            {/* Powered by */}
            <div className="mt-4 text-center text-[10px] text-muted-foreground">
              Powered by{" "}
              <span className="font-medium">CockroachDB</span> distributed
              vector indexing · Always-on · Zero data loss
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}