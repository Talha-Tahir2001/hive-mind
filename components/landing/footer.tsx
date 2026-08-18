import Link from "next/link";
import { IconBrain, IconBrandGithub } from "@tabler/icons-react";

export function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <IconBrain className="h-4 w-4" />
          <span>HiveMind — CockroachDB × AWS Hackathon 2025</span>
        </div>
        <Link
          href="https://github.com/Talha-Tahir2001/hive-mind"
          target="_blank"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <IconBrandGithub className="h-4 w-4" />
          Source Code
        </Link>
      </div>
    </footer>
  );
}