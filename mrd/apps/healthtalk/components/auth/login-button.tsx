'use client';

import { useAuth } from '@mrd/sdk';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface LoginButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  /** Path to redirect to after login */
  callbackUrl?: string;
  /** Custom button content */
  children?: ReactNode;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost';
}

/**
 * LoginButton - Button that redirects to sign-in
 * 
 * @example
 * ```tsx
 * <LoginButton callbackUrl="/dashboard">
 *   Sign In
 * </LoginButton>
 * ```
 */
export function LoginButton({
  callbackUrl,
  children = 'Sign In',
  variant = 'primary',
  className = '',
  ...props
}: LoginButtonProps) {
  const { signIn, isLoading } = useAuth();

  const baseClasses = 'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary',
    secondary: 'border border-border bg-background text-foreground hover:bg-accent focus:ring-primary',
    ghost: 'text-foreground hover:bg-accent focus:ring-primary',
  };

  return (
    <button
      onClick={() => signIn(callbackUrl)}
      disabled={isLoading}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
}

export default LoginButton;
