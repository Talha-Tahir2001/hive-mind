import { Geist_Mono, IBM_Plex_Sans, Noto_Serif } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";

const notoSerifHeading = Noto_Serif({subsets:['latin'],variable:'--font-heading'});

const ibmPlexSans = IBM_Plex_Sans({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "HiveMind — Agents that Remember Together",
  description:
    "Multi-agent system with shared persistent memory powered by CockroachDB. When one agent learns, they all learn.",
  keywords: [
    "AI agents",
    "agentic memory",
    "CockroachDB",
    "AWS",
    "multi-agent",
    "hive mind",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", ibmPlexSans.variable, notoSerifHeading.variable)}
    >
      <body>
        <ClerkProvider>
          <ThemeProvider 
            attribute="class" 
            defaultTheme="system" 
            enableSystem 
            disableTransitionOnChange>
              <TooltipProvider />
            {children}
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}

