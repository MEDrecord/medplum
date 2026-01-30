import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-1024-transparent-sMXHQsKB9VxbAxLQ17TmJPrYOz6XtI.png"
              alt="MedSafe Logo"
              width={40}
              height={40}
              className="h-10 w-10"
            />
            <div className="flex flex-col">
              <span className="text-xl font-semibold text-[hsl(var(--primary))]">
                MED<span className="font-normal text-foreground">record</span>
              </span>
              <span className="text-xs text-muted-foreground">eHealth platform as a Service</span>
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/docs"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Documentation
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-[hsl(var(--primary))]/10 px-4 py-1.5 text-sm font-medium text-[hsl(var(--primary))] mb-6">
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
            <Link
              href="/login"
              className="w-full sm:w-auto rounded-lg bg-[hsl(var(--accent))] px-8 py-3 text-base font-semibold text-[hsl(var(--accent-foreground))] hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
            <Link
              href="/agents"
              className="w-full sm:w-auto rounded-lg border-2 border-[hsl(var(--primary))] bg-transparent px-8 py-3 text-base font-medium text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/5 transition-colors"
            >
              Explore Agents
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-muted/50">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-center text-2xl font-bold mb-4">
            What You Can Explore
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Built on MEDrecord&apos;s AI and Agentic framework for secure, compliant eHealth innovation
          </p>
          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard
              title="PROM Agent"
              description="Automated patient-reported outcome questionnaires sent via WhatsApp with intelligent follow-up and FHIR-compliant data storage."
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />
            <FeatureCard
              title="Visual Workflows"
              description="Design and monitor agent workflows with React Flow-based visual editors. See real-time execution and debug with ease."
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              }
            />
            <FeatureCard
              title="Multi-Tenant"
              description="Isolated research environments with role-based access control, audit logging, and EHDS-compliant data handling."
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-8 md:grid-cols-4 text-center">
            <TrustItem label="FHIR R4" sublabel="Compliant" />
            <TrustItem label="EHDS" sublabel="Ready" />
            <TrustItem label="NEN 7510" sublabel="Certified" />
            <TrustItem label="AI-Powered" sublabel="Agents" />
          </div>
        </div>
      </section>

      {/* Researcher Notice */}
      <section className="border-t border-border bg-[hsl(var(--primary))]/5">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="rounded-xl border border-[hsl(var(--primary))]/20 bg-card p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--teal))] text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Researcher Tracking Notice</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  This is an example application for healthcare researchers. By signing in,
                  you agree that your access will be logged to help us understand platform
                  adoption and improve the developer experience. All data is handled in compliance
                  with GDPR and healthcare regulations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-[hsl(var(--foreground))]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Made%20with%20love%20by%20medrecord-O8x7giogCTGnuUtIeBXdKfM77ceckY.png"
                alt="Made with love by MEDrecord"
                width={280}
                height={50}
                className="h-10 w-auto"
              />
            </div>
            <div className="flex items-center gap-6 text-sm text-white/70">
              <Link href="https://medrecord.io" className="hover:text-white transition-colors">
                MEDrecord.io
              </Link>
              <Link href="https://healthtalk.ai" className="hover:text-white transition-colors">
                HealthTalk.ai
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-white/50">
            Part of the MEDrecord ecosystem: MedSafe, Coachi, HealthTalk
          </div>
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
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[hsl(var(--teal))] text-white">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  )
}

function TrustItem({ label, sublabel }: { label: string; sublabel: string }) {
  return (
    <div>
      <div className="text-2xl font-bold text-[hsl(var(--primary))]">{label}</div>
      <div className="text-sm text-muted-foreground">{sublabel}</div>
    </div>
  )
}
