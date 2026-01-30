import Link from 'next/link'
import { getConfigSafe } from '@/lib/config'

export default function HomePage() {
  const config = getConfigSafe()
  const isConfigured = config !== null

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              MR
            </div>
            <span className="text-xl font-semibold">MEDrecord</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/docs"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Documentation
            </Link>
            {isConfigured ? (
              <Link
                href="/login"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Sign In
              </Link>
            ) : (
              <span className="rounded-lg bg-muted px-4 py-2 text-sm text-muted-foreground">
                Not Configured
              </span>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            Research Example Application
          </span>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-balance">
            Agent-Driven Healthcare Workflows
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed text-pretty">
            Explore how intelligent agents can automate patient questionnaires,
            coordinate care workflows, and integrate with WhatsApp for seamless
            patient communication.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {isConfigured ? (
              <Link
                href="/login"
                className="w-full sm:w-auto rounded-lg bg-primary px-8 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Get Started
              </Link>
            ) : (
              <SetupInstructions />
            )}
            <Link
              href="/docs"
              className="w-full sm:w-auto rounded-lg border bg-card px-8 py-3 text-base font-medium hover:bg-accent transition-colors"
            >
              Read Documentation
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-center text-2xl font-bold mb-12">
            What You Can Explore
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard
              title="PROM Agent"
              description="Automated patient-reported outcome questionnaires sent via WhatsApp with intelligent follow-up."
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />
            <FeatureCard
              title="Visual Workflows"
              description="Design and monitor agent workflows with React Flow-based visual editors."
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              }
            />
            <FeatureCard
              title="Multi-Tenant"
              description="Isolated research environments with role-based access control and audit logging."
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* Researcher Notice */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Researcher Tracking Notice</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  This is an example application for healthcare researchers. By signing in,
                  you agree that your access will be logged to help us understand platform
                  adoption and improve the developer experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <p className="text-center text-sm text-muted-foreground">
            MEDrecord Researcher App - Part of the HealthTalk.ai ecosystem
          </p>
        </div>
      </footer>
    </main>
  )
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  )
}

function SetupInstructions() {
  return (
    <div className="w-full rounded-lg border bg-card p-6 text-left">
      <h3 className="font-semibold text-amber-600">Setup Required</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Add these environment variables to get started:
      </p>
      <pre className="mt-3 rounded bg-muted p-3 text-xs font-mono overflow-x-auto">
{`HEALTHTALK_GATEWAY_URL=https://auth-test-b2c.healthtalk.ai
HEALTHTALK_TENANT_ID=your-tenant-id
HEALTHTALK_CLIENT_ID=your-client-id`}
      </pre>
    </div>
  )
}
