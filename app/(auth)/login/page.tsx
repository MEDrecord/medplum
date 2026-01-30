import Link from 'next/link'

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-1024-transparent-sMXHQsKB9VxbAxLQ17TmJPrYOz6XtI.png"
              alt="MedSafe Logo"
              width={48}
              height={48}
              className="h-12 w-12"
            />
            <div className="flex flex-col text-left">
              <span className="text-xl font-semibold tracking-tight">
                <span className="text-primary">MED</span>
                <span className="text-foreground">record</span>
              </span>
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                Research Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Login Card */}
        <div className="rounded-xl border border-border bg-card p-8 shadow-lg">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to access the MEDrecord research platform
            </p>
          </div>

          {/* Gateway Login Button */}
          <button
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Sign in with MEDrecord Gateway
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Secure authentication</span>
            </div>
          </div>

          {/* Info */}
          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <p className="font-medium text-foreground">Enterprise-grade security</p>
                <p className="mt-1">
                  Authentication is handled securely through the MEDrecord Gateway 
                  with Azure AD B2C integration.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to MEDrecord?{' '}
          <Link href="/onboarding" className="font-medium text-primary hover:underline">
            Request access
          </Link>
        </p>
      </div>
    </main>
  )
}
