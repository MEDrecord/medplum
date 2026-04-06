'use client';

import { useState } from 'react';
import { User, LogOut, Building2, ChevronDown, Settings } from 'lucide-react';
import { cn } from '@mrd/ui/lib/utils';
import { useAuth, type GatewayUser } from '@mrd/sdk';

interface UserMenuProps {
  /** Override user from props (uses auth context if not provided) */
  user?: {
    name: string;
    email: string;
    role: string;
    initials?: string;
  };
  organizations?: Array<{
    id: string;
    name: string;
  }>;
  currentOrganization?: string;
}

/**
 * Get initials from name
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * UserMenu - Dropdown menu showing user info and actions
 * 
 * Uses auth context by default, but can accept user override via props.
 */
export function UserMenu({ user: userProp, organizations = [], currentOrganization }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user: authUser, isLoading, isAuthenticated, signIn, signOut } = useAuth();

  // Use prop user if provided, otherwise use auth context user
  const user = userProp ?? (authUser ? {
    name: authUser.name,
    email: authUser.email,
    role: authUser.role,
    initials: getInitials(authUser.name),
  } : null);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-md px-3 py-2">
        <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  // Show login button if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <button
        onClick={() => signIn()}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Inloggen
      </button>
    );
  }

  const initials = user.initials ?? getInitials(user.name);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
          {initials}
        </div>
        <span className="text-sm font-medium">{user.name}</span>
        <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border bg-card shadow-lg">
            {/* User Info */}
            <div className="border-b p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-medium text-primary-foreground">
                  {initials}
                </div>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <span className="inline-block mt-1 rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Link */}
            <div className="border-b p-2">
              <a 
                href="/profile"
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                onClick={() => setIsOpen(false)}
              >
                <User className="h-4 w-4" />
                Profiel
              </a>
              <a 
                href="/settings"
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="h-4 w-4" />
                Instellingen
              </a>
            </div>

            {/* Organizations */}
            {organizations.length > 0 && (
              <div className="border-b p-2">
                <p className="px-3 py-1 text-xs font-medium uppercase text-muted-foreground">
                  Organisaties
                </p>
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted',
                      currentOrganization === org.id && 'bg-muted'
                    )}
                  >
                    <Building2 className="h-4 w-4" />
                    {org.name}
                  </button>
                ))}
              </div>
            )}

            {/* Logout */}
            <div className="p-2">
              <button 
                onClick={async () => {
                  setIsOpen(false);
                  await signOut();
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Uitloggen
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
