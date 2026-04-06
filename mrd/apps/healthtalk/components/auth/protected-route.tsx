'use client';

import { useAuth, type GatewayRole } from '@mrd/sdk';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Required role(s) to access this route */
  requiredRole?: GatewayRole | GatewayRole[];
  /** Fallback content while loading */
  loadingFallback?: ReactNode;
  /** Fallback content when unauthorized */
  unauthorizedFallback?: ReactNode;
  /** Callback when user is not authenticated */
  onUnauthenticated?: () => void;
}

/**
 * ProtectedRoute - Client-side route protection
 * 
 * Wraps content that requires authentication.
 * Shows loading state while checking auth, and redirects/shows fallback if not authenticated.
 * 
 * @example
 * ```tsx
 * <ProtectedRoute requiredRole="tenant_admin">
 *   <AdminDashboard />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({
  children,
  requiredRole,
  loadingFallback,
  unauthorizedFallback,
  onUnauthenticated,
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated, signIn } = useAuth();

  // Loading state
  if (isLoading) {
    return loadingFallback ?? <DefaultLoadingFallback />;
  }

  // Not authenticated
  if (!isAuthenticated) {
    if (onUnauthenticated) {
      onUnauthenticated();
    }
    return unauthorizedFallback ?? <DefaultUnauthorizedFallback onSignIn={() => signIn()} />;
  }

  // Check role if required
  if (requiredRole && user) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const hasRequiredRole = roles.includes(user.role);

    if (!hasRequiredRole) {
      return unauthorizedFallback ?? (
        <DefaultForbiddenFallback 
          currentRole={user.role}
          requiredRoles={roles}
        />
      );
    }
  }

  // Authenticated and authorized
  return <>{children}</>;
}

// Default fallback components

function DefaultLoadingFallback() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function DefaultUnauthorizedFallback({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-6 text-center">
        <h2 className="text-lg font-semibold text-foreground">
          Authentication Required
        </h2>
        <p className="text-sm text-muted-foreground">
          Please sign in to access this content.
        </p>
        <button
          onClick={onSignIn}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Sign In
        </button>
      </div>
    </div>
  );
}

function DefaultForbiddenFallback({ 
  currentRole, 
  requiredRoles 
}: { 
  currentRole: GatewayRole;
  requiredRoles: GatewayRole[];
}) {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="w-full max-w-md space-y-4 rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <h2 className="text-lg font-semibold text-foreground">
          Access Denied
        </h2>
        <p className="text-sm text-muted-foreground">
          You don&apos;t have permission to access this content.
        </p>
        <p className="text-xs text-muted-foreground">
          Your role: <span className="font-medium">{currentRole}</span>
          <br />
          Required: <span className="font-medium">{requiredRoles.join(' or ')}</span>
        </p>
        <a
          href="/"
          className="inline-block rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
        >
          Go to Home
        </a>
      </div>
    </div>
  );
}

export default ProtectedRoute;
