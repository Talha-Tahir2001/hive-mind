import Link from "next/link";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { IconBrandGithub, IconArrowRight, IconBrain } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
// import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { MemoryDifference } from "@/components/landing/memory-difference";
import { BuiltWith } from "@/components/landing/built-with";
import { Footer } from "@/components/landing/footer";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <IconBrain className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">HiveMind</span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            <Button variant="ghost" size="sm">
              <Link
                href="https://github.com/Talha-Tahir2001/hive-mind"
                target="_blank"
              >
                <IconBrandGithub className="h-4 w-4" />
              </Link>
            </Button>

            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm">Try Demo</Button>
              </SignUpButton>
            </Show>

            <Show when="signed-in">
              <Button size="sm" className="inline-flex items-center">
                <Link className="inline-flex items-center" href="/dashboard">
                  Dashboard
                  <IconArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
              <UserButton />
            </Show>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <MemoryDifference />
        <BuiltWith />
      </main>

      <Footer />
    </div>
  );
}