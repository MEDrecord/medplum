'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { redirectToSignIn } from '@mrd/sdk';

/**
 * Sign In Page
 * 
 * Redirects to HealthTalk Gateway for authentication.
 * Handles callback URL from query params.
 */
export default function SignInPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const callbackUrl = searchParams.get('callbackUrl') ?? searchParams.get('redirect') ?? '/';

  useEffect(() => {
    // If there's an error, don't auto-redirect
    if (error) return;

    // Redirect to gateway sign-in
    redirectToSignIn(callbackUrl);
  }, [error, callbackUrl]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 shadow-sm">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold text-foreground">
              Authentication Error
            </h1>
            <p className="text-sm text-muted-foreground">
              {getErrorMessage(error)}
            </p>
          </div>
          <div className="space-y-4">
            <button
              onClick={() => redirectToSignIn(callbackUrl)}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Try Again
            </button>
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
        <p className="text-muted-foreground">Redirecting to sign in...</p>
      </div>
    </div>
  );
}

function getErrorMessage(error: string): string {
  switch (error) {
    case 'session_invalid':
      return 'Your session has expired. Please sign in again.';
    case 'session_expired':
      return 'Your session has expired. Please sign in again.';
    case 'access_denied':
      return 'Access was denied. Please try again or contact support.';
    case 'token_exchange_failed':
      return 'Failed to complete sign in. Please try again.';
    default:
      return error || 'An unexpected error occurred. Please try again.';
  }
}
