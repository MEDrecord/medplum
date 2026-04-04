'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  MessageSquare, 
  Users, 
  LayoutTemplate, 
  Shield,
  User,
  ChevronDown
} from 'lucide-react';
import { cn } from '@mrd/ui/lib/utils';
import { VERSION } from '@/lib/version';

const mainNavItems = [
  {
    label: 'Gesprekken',
    href: '/gesprekken',
    icon: MessageSquare,
  },
  {
    label: 'Cliënten',
    href: '/clienten',
    icon: Users,
  },
  {
    label: 'Sjablonen',
    href: '/sjablonen',
    icon: LayoutTemplate,
  },
];

const bottomNavItems = [
  {
    label: 'Admin',
    href: '/admin',
    icon: Shield,
  },
  {
    label: 'Profiel',
    href: '/profiel',
    icon: User,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-[72px] flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-sidebar-border">
        <Link href="/">
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
      <nav className="flex flex-1 flex-col items-center gap-1 py-4">
        {mainNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg p-3 text-xs transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="flex flex-col items-center gap-1 border-t border-sidebar-border py-4">
        {bottomNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg p-3 text-xs transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}

        {/* Language Selector */}
        <button className="mt-2 flex items-center gap-1 rounded-lg border border-sidebar-border px-2 py-1 text-xs text-sidebar-foreground/70 hover:bg-sidebar-accent/50">
          NL
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      {/* Version Footer */}
      <div className="border-t border-sidebar-border p-2 text-center">
        <p className="text-[9px] text-sidebar-foreground/50">
          {VERSION.short}
        </p>
      </div>
    </aside>
  );
}
