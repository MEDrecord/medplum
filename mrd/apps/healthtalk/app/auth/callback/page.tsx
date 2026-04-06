'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { handleAuthCallback } from '@mrd/sdk';

/**
 * Auth Callback Page
 * 
 * Handles the OAuth callback from HealthTalk Gateway.
 * Supports both cookie mode (same-domain) and webToken mode (cross-domain).
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function processCallback() {
      try {
        const result = await handleAuthCallback(searchParams);

        if (result.success) {
          // Successful authentication - redirect to intended destination
          router.replace(result.redirectUrl);
        } else {
          // Authentication failed
          setError(result.error ?? 'Authentication failed');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      }
    }

    processCallback();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 shadow-sm">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold text-foreground">
              Authentication Failed
            </h1>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <div className="space-y-4">
            <a
              href="/auth/signin"
              className="block w-full rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Try Again
            </a>
            <a
              href="/"
              className="block w-full rounded-md border border-border bg-background px-4 py-2 text-center text-sm font-medium text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Go to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="space-y-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
