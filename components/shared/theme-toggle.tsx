"use client";

import * as React from "react";
import {IconSun, IconMoon, IconDeviceDesktop} from "@tabler/icons-react"
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const themes = [
    {
        name: "Light",
        value: "light",
        icon: IconSun,
    },
    {
        name: "Dark",
        value: "dark",
        icon: IconMoon,
    },
    {
        name: "System",
        value: "system",
        icon: IconDeviceDesktop,
    },
];

export function ThemeToggle() {
    const mounted = React.useSyncExternalStore(
        () => () => {},
        () => true,
        () => false
    );
    const { setTheme, resolvedTheme } = useTheme();

    if (!mounted) {
        return null;
    }
    return (
        <DropdownMenu>
            <DropdownMenuTrigger>
                <Button className="cursor-pointer" variant="outline" size="icon">
                    {resolvedTheme === "dark" ? <IconSun /> : <IconMoon />}
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {themes.map((theme) => (
                    <DropdownMenuItem
                        key={theme.value}
                        onClick={() => setTheme(theme.value)}
                    >
                        <theme.icon className="size-4" />
                        {theme.name}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
