"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconBrain,
  IconLayoutDashboard,
  IconRobot,
  IconDatabase,
  IconPlayerPlay,
  IconSettings,
} from "@tabler/icons-react";
import { UserButton } from "@clerk/nextjs";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/shared/theme-toggle";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: IconLayoutDashboard,
  },
  {
    label: "Agents",
    href: "/dashboard/agents",
    icon: IconRobot,
  },
  {
    label: "Memories",
    href: "/dashboard/memories",
    icon: IconDatabase,
  },
  {
    label: "Pipeline",
    href: "/dashboard/pipeline",
    icon: IconPlayerPlay,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: IconSettings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Dashboard"
              className="w-full"
              render={
                <Link
                  href="/dashboard"
                  className="flex w-full items-center gap-2 overflow-hidden text-left group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                >
                  <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <IconBrain className="size-4" />
                  </div>
                  <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold">HiveMind</span>
                    <span className="truncate text-xs text-muted-foreground">
                      Agentic Memory
                    </span>
                  </div>
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  pathname.startsWith(item.href));

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isActive}
                    tooltip={item.label}
                    className="w-full"
                    render={
                      <Link
                        href={item.href}
                        className="flex w-full items-center gap-2 overflow-hidden text-left group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                      >
                        <item.icon className="size-4 shrink-0" />
                        <span className="truncate group-data-[collapsible=icon]:hidden">
                          {item.label}
                        </span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between gap-2 px-2 py-1.5">
              <span className="text-xs text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <UserButton />
              <span className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                Signed in
              </span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}