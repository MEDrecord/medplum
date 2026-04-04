'use client';

import { useState } from 'react';
import { User, LogOut, Building2, ChevronDown } from 'lucide-react';
import { cn } from '@mrd/ui/lib/utils';

interface UserMenuProps {
  user: {
    name: string;
    email: string;
    role: string;
    initials: string;
  };
  organizations?: Array<{
    id: string;
    name: string;
  }>;
  currentOrganization?: string;
}

export function UserMenu({ user, organizations = [], currentOrganization }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
          {user.initials}
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
                  {user.initials}
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
              <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted">
                <User className="h-4 w-4" />
                Profiel
              </button>
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
              <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10">
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
