import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-1024-transparent-sMXHQsKB9VxbAxLQ17TmJPrYOz6XtI.png"
              alt="MedSafe Logo"
              width={36}
              height={36}
              className="h-9 w-9"
            />
            <div className="flex flex-col">
              <span className="text-lg font-semibold tracking-tight">
                <span className="text-primary">MED</span>
                <span className="text-foreground">record</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                eHealth Platform
              </span>
            </div>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/docs"
              className="px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Documentation
            </Link>
            <Link
              href="/agents"
              className="px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Agents
            </Link>
            <Link
              href="/login"
              className="ml-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        
        <div className="mx-auto max-w-6xl px-6 pb-24 pt-20">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal/30 bg-teal/10 px-4 py-1.5 text-sm font-medium text-teal">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-teal"></span>
                </span>
                Research Example Application
              </div>
              
              <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.5rem] lg:leading-[1.1]">
                Agent-Driven{' '}
                <span className="text-primary">Healthcare</span>{' '}
                Workflows
              </h1>
              
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Explore how intelligent agents automate patient questionnaires, 
                coordinate care workflows, and integrate with WhatsApp for 
                seamless patient communication.
              </p>
              
              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-base font-semibold text-accent-foreground shadow-lg shadow-accent/25 transition-all hover:shadow-xl hover:shadow-accent/30"
                >
                  Get Started
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  href="/docs"
                  className="inline-flex items-center gap-2 rounded-lg border-2 border-border bg-background px-6 py-3 text-base font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  View Documentation
                </Link>
              </div>
              
              {/* Trust Badges */}
              <div className="mt-12 flex flex-wrap items-center gap-6 border-t border-border pt-8">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg className="h-5 w-5 text-teal" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  FHIR R4 Compliant
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg className="h-5 w-5 text-teal" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  EHDS Ready
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg className="h-5 w-5 text-teal" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  NEN 7510 Certified
                </div>
              </div>
            </div>
            
            {/* Right Visual - Agent Workflow Illustration */}
            <div className="relative lg:pl-8">
              <div className="relative rounded-2xl border border-border bg-card p-6 shadow-2xl shadow-primary/5">
                {/* Mock Workflow Diagram */}
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">PROM Agent Workflow</span>
                  <span className="flex items-center gap-1.5 rounded-full bg-teal/10 px-2.5 py-1 text-xs font-medium text-teal">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal"></span>
                    Active
                  </span>
                </div>
                
                {/* Workflow Nodes */}
                <div className="space-y-3">
                  <WorkflowNode 
                    type="trigger" 
                    label="Appointment Scheduled"
                    status="complete"
                  />
                  <WorkflowConnector />
                  <WorkflowNode 
                    type="action" 
                    label="Get Patient Details"
                    status="complete"
                  />
                  <WorkflowConnector />
                  <WorkflowNode 
                    type="condition" 
                    label="Has Phone Number?"
                    status="complete"
                  />
                  <WorkflowConnector />
                  <WorkflowNode 
                    type="action" 
                    label="Send WhatsApp PROM"
                    status="running"
                  />
                  <WorkflowConnector />
                  <WorkflowNode 
                    type="outcome" 
                    label="Questionnaire Sent"
                    status="pending"
                  />
                </div>
                
                {/* Decorative Glow */}
                <div className="absolute -inset-px -z-10 rounded-2xl bg-gradient-to-b from-primary/20 to-transparent opacity-0 blur-xl transition-opacity group-hover:opacity-100" />
              </div>
              
              {/* Floating Badge */}
              <div className="absolute -right-4 top-8 rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20">
                    <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="text-xs">
                    <div className="font-medium text-foreground">AI Powered</div>
                    <div className="text-muted-foreground">Intelligent agents</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              What You Can Explore
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Built on MEDrecord&apos;s AI and Agentic framework for secure, 
              compliant eHealth innovation
            </p>
          </div>
          
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              }
              title="PROM Agent"
              description="Automated patient-reported outcome questionnaires sent via WhatsApp with intelligent follow-up and FHIR-compliant data storage."
              linkHref="/agents/prom"
              linkLabel="Explore PROM Agent"
            />
            <FeatureCard
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              }
              title="Visual Workflows"
              description="Design and monitor agent workflows with React Flow-based visual editors. See real-time execution and debug with ease."
              linkHref="/workflows"
              linkLabel="View Workflows"
            />
            <FeatureCard
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
              title="Multi-Tenant"
              description="Isolated research environments with role-based access control, audit logging, and EHDS-compliant data handling."
              linkHref="/tenants"
              linkLabel="Learn About Tenants"
            />
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Gateway-First Architecture
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                All data flows through the HealthTalk Gateway, ensuring secure, 
                auditable access to healthcare data with full FHIR compliance.
              </p>
              
              <ul className="mt-8 space-y-4">
                <ArchitectureItem
                  title="Zero Direct Database Access"
                  description="All data requests go through the secure gateway layer"
                />
                <ArchitectureItem
                  title="Role-Based Access Control"
                  description="Fine-grained permissions based on FHIR roles"
                />
                <ArchitectureItem
                  title="Full Audit Trail"
                  description="Every data access is logged for compliance"
                />
                <ArchitectureItem
                  title="Multi-Tenant Isolation"
                  description="Complete data separation between research groups"
                />
              </ul>
            </div>
            
            <div className="rounded-2xl border border-border bg-card p-8">
              <pre className="text-sm text-muted-foreground overflow-x-auto">
                <code>{`┌─────────────────┐
│   Next.js GUI   │
│   (Browser)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Next.js API    │
│  Server Actions │
└────────┬────────┘
         │ Secure
         ▼
┌─────────────────┐
│   HealthTalk    │
│    Gateway      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  FHIR Resources │
│   EPD / ECD     │
└─────────────────┘`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Researcher Notice */}
      <section className="border-t border-border bg-primary/5">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col gap-6 rounded-2xl border border-primary/20 bg-card p-8 md:flex-row md:items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Researcher Tracking Notice
              </h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                This is an example application for healthcare researchers. By signing in,
                you agree that your access will be logged to help us understand platform
                adoption and improve the developer experience. All data is handled in 
                compliance with GDPR and healthcare regulations.
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Made%20with%20love%20by%20medrecord-O8x7giogCTGnuUtIeBXdKfM77ceckY.png"
                alt="Made with love by MEDrecord"
                width={240}
                height={40}
                className="h-8 w-auto"
              />
              <p className="mt-3 text-sm text-muted-foreground">
                Part of the MEDrecord ecosystem
              </p>
            </div>
            
            <nav className="flex flex-wrap gap-x-8 gap-y-4 text-sm">
              <Link href="https://medrecord.io" className="text-muted-foreground hover:text-foreground transition-colors">
                MEDrecord.io
              </Link>
              <Link href="https://healthtalk.ai" className="text-muted-foreground hover:text-foreground transition-colors">
                HealthTalk.ai
              </Link>
              <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
                Documentation
              </Link>
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </Link>
            </nav>
          </div>
          
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8 text-sm text-muted-foreground">
            <p>MedSafe, Coachi, HealthTalk are trademarks of MEDrecord</p>
            <p>Built with Next.js, React Flow, and FHIR R4</p>
          </div>
        </div>
      </footer>
    </main>
  )
}

function WorkflowNode({ 
  type, 
  label, 
  status 
}: { 
  type: 'trigger' | 'action' | 'condition' | 'outcome'
  label: string
  status: 'complete' | 'running' | 'pending'
}) {
  const typeColors = {
    trigger: 'bg-accent/20 border-accent/40 text-accent',
    action: 'bg-primary/20 border-primary/40 text-primary',
    condition: 'bg-secondary/20 border-secondary/40 text-secondary',
    outcome: 'bg-teal/20 border-teal/40 text-teal',
  }
  
  const statusIcons = {
    complete: (
      <svg className="h-4 w-4 text-teal" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    running: (
      <svg className="h-4 w-4 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    ),
    pending: (
      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
    ),
  }
  
  return (
    <div className={`flex items-center justify-between rounded-lg border px-4 py-3 ${typeColors[type]}`}>
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium uppercase opacity-70">{type}</span>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      {statusIcons[status]}
    </div>
  )
}

function WorkflowConnector() {
  return (
    <div className="flex justify-center">
      <div className="h-4 w-px bg-border" />
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  linkHref,
  linkLabel,
}: {
  icon: React.ReactNode
  title: string
  description: string
  linkHref: string
  linkLabel: string
}) {
  return (
    <div className="group relative rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        {icon}
      </div>
      <h3 className="mt-4 text-xl font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-muted-foreground leading-relaxed">{description}</p>
      <Link
        href={linkHref}
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        {linkLabel}
        <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  )
}

function ArchitectureItem({ 
  title, 
  description 
}: { 
  title: string
  description: string 
}) {
  return (
    <li className="flex gap-4">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal/20">
        <svg className="h-3.5 w-3.5 text-teal" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
      <div>
        <h4 className="font-medium text-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </li>
  )
}
