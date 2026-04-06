'use client';

import { useEffect, useState } from 'react';
import { signOut } from '@mrd/sdk';

/**
 * Sign Out Page
 * 
 * Handles user sign out and redirects to home.
 */
export default function SignOutPage() {
  const [isSigningOut, setIsSigningOut] = useState(true);

  useEffect(() => {
    async function performSignOut() {
      try {
        await signOut({ redirect: true, redirectUrl: '/' });
      } catch {
        // Even if signout fails, redirect to home
        window.location.href = '/';
      }
    }

    performSignOut();
  }, []);

  if (!isSigningOut) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 shadow-sm">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold text-foreground">
              Signed Out
            </h1>
            <p className="text-sm text-muted-foreground">
              You have been successfully signed out.
            </p>
          </div>
          <a
            href="/"
            className="block w-full rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="space-y-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="text-muted-foreground">Signing out...</p>
      </div>
    </div>
  );
}
