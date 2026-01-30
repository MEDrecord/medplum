import Link from 'next/link'

const sections = [
  {
    title: 'Getting Started',
    description: 'Learn the basics of the MEDrecord platform',
    links: [
      { title: 'Introduction', href: '/docs#introduction' },
      { title: 'Quick Start Guide', href: '/docs#quickstart' },
      { title: 'Authentication', href: '/docs#authentication' },
    ],
  },
  {
    title: 'Architecture',
    description: 'Understand the gateway-first design',
    links: [
      { title: 'Gateway Overview', href: '/docs#gateway' },
      { title: 'FHIR Integration', href: '/docs#fhir' },
      { title: 'Multi-Tenant Design', href: '/docs#multi-tenant' },
    ],
  },
  {
    title: 'Agents',
    description: 'Build intelligent healthcare workflows',
    links: [
      { title: 'Agent Framework', href: '/docs#agents' },
      { title: 'Triggers & Tools', href: '/docs#triggers' },
      { title: 'Data Access Policies', href: '/docs#data-access' },
    ],
  },
  {
    title: 'React Flow',
    description: 'Visualize and design workflows',
    links: [
      { title: 'Workflow Canvas', href: '/docs#canvas' },
      { title: 'Custom Nodes', href: '/docs#nodes' },
      { title: 'Execution State', href: '/docs#execution' },
    ],
  },
]

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-background">
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
                Documentation
              </span>
            </div>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Home
            </Link>
            <Link
              href="/dashboard/agents"
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

      {/* Hero */}
      <section className="border-b border-border bg-muted/30 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h1 className="text-4xl font-bold tracking-tight">Documentation</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Learn how to build agent-driven healthcare workflows with the MEDrecord platform. 
            From authentication to FHIR integration, we have you covered.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          {/* Quick Links Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {sections.map((section) => (
              <div
                key={section.title}
                className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md"
              >
                <h2 className="text-xl font-semibold">{section.title}</h2>
                <p className="mt-2 text-muted-foreground">{section.description}</p>
                <ul className="mt-4 space-y-2">
                  {section.links.map((link) => (
                    <li key={link.title}>
                      <Link
                        href={link.href}
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Introduction Section */}
          <div id="introduction" className="mt-16 scroll-mt-24">
            <h2 className="text-3xl font-bold tracking-tight">Introduction</h2>
            <div className="mt-6 prose prose-gray max-w-none">
              <p className="text-lg text-muted-foreground leading-relaxed">
                MEDrecord is an intelligent, agent-driven layer around existing healthcare systems (EPDs/ECDs). 
                This example application demonstrates how researchers can explore and build secure, compliant 
                eHealth applications using the MEDrecord Gateway.
              </p>
              
              <div className="mt-8 rounded-xl border border-border bg-card p-6">
                <h3 className="text-lg font-semibold">Key Concepts</h3>
                <ul className="mt-4 space-y-3 text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">1</span>
                    <span><strong className="text-foreground">Gateway-First:</strong> All data flows through the MEDrecord Gateway, never directly from the UI to databases.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">2</span>
                    <span><strong className="text-foreground">Agent-Driven:</strong> Features are defined as autonomous agents with triggers, tools, and outcomes.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">3</span>
                    <span><strong className="text-foreground">FHIR Facade:</strong> External-facing contracts are FHIR-compatible while internal implementations remain flexible.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">4</span>
                    <span><strong className="text-foreground">Multi-Tenant:</strong> Each research group operates in an isolated tenant with separate data and configuration.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Architecture Section */}
          <div id="gateway" className="mt-16 scroll-mt-24">
            <h2 className="text-3xl font-bold tracking-tight">Gateway Architecture</h2>
            <div className="mt-6">
              <p className="text-lg text-muted-foreground leading-relaxed">
                The MEDrecord Gateway is the central hub for all data access. It handles authentication, 
                authorization, FHIR resource routing, and agent execution.
              </p>
              
              <div className="mt-8 rounded-xl border border-border bg-foreground p-6 font-mono text-sm text-background overflow-x-auto">
                <pre>{`┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js GUI   │────▶│  Next.js API    │────▶│    MEDrecord    │
│   (Browser)     │     │  Routes/Actions │     │    Gateway      │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                    ┌────────────────────┼────────────────────┐
                                    ▼                    ▼                    ▼
                             ┌───────────┐        ┌───────────┐        ┌───────────┐
                             │   FHIR    │        │  WhatsApp │        │   Agent   │
                             │  Server   │        │    API    │        │  Runtime  │
                             └───────────┘        └───────────┘        └───────────┘`}</pre>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
            <h3 className="text-2xl font-semibold">Ready to get started?</h3>
            <p className="mt-2 text-muted-foreground">
              Sign in with your MEDrecord Gateway credentials to explore the platform.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <Link
                href="/login"
                className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
              >
                Sign In
              </Link>
              <Link
                href="/onboarding"
                className="rounded-lg border-2 border-border bg-background px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                Request Access
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-muted-foreground">
          <p>Powered by MEDrecord - eHealth Platform as a Service</p>
        </div>
      </footer>
    </main>
  )
}
