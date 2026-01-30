import Link from 'next/link'

export default function OnboardingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted p-6">
      <div className="w-full max-w-lg">
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

        {/* Onboarding Card */}
        <div className="rounded-xl border border-border bg-card p-8 shadow-lg">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
              <svg className="h-7 w-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Request Research Access</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Tell us about your research to get started with MEDrecord
            </p>
          </div>

          {/* Form */}
          <form className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Dr. Jane Smith"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Work Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="jane.smith@university.edu"
                required
              />
            </div>

            <div>
              <label htmlFor="organization" className="block text-sm font-medium text-foreground">
                Organization
              </label>
              <input
                type="text"
                id="organization"
                name="organization"
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="University Medical Center"
                required
              />
            </div>

            <div>
              <label htmlFor="purpose" className="block text-sm font-medium text-foreground">
                Research Purpose
              </label>
              <textarea
                id="purpose"
                name="purpose"
                rows={3}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                placeholder="Briefly describe your research goals..."
                required
              />
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                required
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground">
                I agree to the{' '}
                <Link href="/terms" className="font-medium text-primary hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="font-medium text-primary hover:underline">
                  Privacy Policy
                </Link>
                . I understand my access will be tracked for research purposes.
              </label>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground shadow-sm transition-all hover:bg-accent/90 hover:shadow-md"
            >
              Submit Request
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have access?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
