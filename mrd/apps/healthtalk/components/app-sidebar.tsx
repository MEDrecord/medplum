"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  MessageSquare,
  Users,
  FileText,
  Settings,
  User,
  ChevronDown,
} from "lucide-react";

const navItems = [
  {
    href: "/gesprekken",
    label: "Gesprekken",
    icon: MessageSquare,
  },
  {
    href: "/clienten",
    label: "Clienten",
    icon: Users,
  },
  {
    href: "/sjablonen",
    label: "Sjablonen",
    icon: FileText,
  },
];

const bottomNavItems = [
  {
    href: "/admin",
    label: "Admin",
    icon: Settings,
  },
  {
    href: "/profiel",
    label: "Profiel",
    icon: User,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-16 flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center">
        <Link href="/" className="flex items-center justify-center">
          <Image
            src="/images/healthtalk-icon.png"
            alt="HealthTalk"
            width={40}
            height={40}
            className="rounded-lg"
          />
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex flex-1 flex-col items-center gap-1 px-2 py-4">
        {navItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex w-full flex-col items-center gap-1 rounded-lg px-2 py-3 text-xs transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <nav className="flex flex-col items-center gap-1 px-2 py-4">
        {bottomNavItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex w-full flex-col items-center gap-1 rounded-lg px-2 py-3 text-xs transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Language Selector */}
        <button className="mt-2 flex items-center gap-1 rounded-lg px-2 py-2 text-xs text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground">
          <span className="text-[10px] font-medium">NL</span>
          <ChevronDown className="h-3 w-3" />
        </button>
      </nav>
    </aside>
  );
}
