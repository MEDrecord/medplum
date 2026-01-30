import Link from 'next/link'

// This would come from the Gateway in production
const researchers = [
  {
    id: '1',
    name: 'Dr. Sarah van der Berg',
    email: 'sarah.vanderberg@vumc.nl',
    organization: 'VU Medical Center',
    purpose: 'Evaluating PROM collection efficiency in oncology care',
    firstAccess: '2026-01-15',
    lastAccess: '2026-01-30',
    accessCount: 47,
    tenantId: 'vumc-research',
  },
  {
    id: '2',
    name: 'Prof. Jan de Vries',
    email: 'j.devries@erasmusmc.nl',
    organization: 'Erasmus MC',
    purpose: 'Researching patient engagement through digital communication',
    firstAccess: '2026-01-20',
    lastAccess: '2026-01-29',
    accessCount: 23,
    tenantId: 'erasmus-study',
  },
  {
    id: '3',
    name: 'Dr. Maria Jansen',
    email: 'maria.jansen@umcutrecht.nl',
    organization: 'UMC Utrecht',
    purpose: 'Agent-driven workflow optimization study',
    firstAccess: '2026-01-22',
    lastAccess: '2026-01-30',
    accessCount: 31,
    tenantId: 'umc-pilot',
  },
  {
    id: '4',
    name: 'Ing. Thomas Bakker',
    email: 't.bakker@philips.com',
    organization: 'Philips Healthcare',
    purpose: 'Integration feasibility assessment',
    firstAccess: '2026-01-25',
    lastAccess: '2026-01-28',
    accessCount: 12,
    tenantId: 'philips-eval',
  },
]

const stats = {
  totalResearchers: 4,
  activeToday: 2,
  organizations: 4,
  totalAccess: 113,
}

export default function ResearchersPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
        <span>/</span>
        <Link href="/dashboard/admin" className="hover:text-foreground">Admin</Link>
        <span>/</span>
        <span className="text-foreground">Researchers</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Researcher Tracking</h1>
          <p className="mt-1 text-muted-foreground">
            Monitor all researchers accessing the MEDrecord example application
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Researchers</p>
              <p className="text-2xl font-semibold">{stats.totalResearchers}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal/10">
              <svg className="h-5 w-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Today</p>
              <p className="text-2xl font-semibold">{stats.activeToday}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Organizations</p>
              <p className="text-2xl font-semibold">{stats.organizations}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
              <svg className="h-5 w-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Access</p>
              <p className="text-2xl font-semibold">{stats.totalAccess}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Researchers Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-semibold">All Researchers</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Researcher
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Research Purpose
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Access
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Tenant
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {researchers.map((researcher) => (
                <tr key={researcher.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{researcher.name}</p>
                      <p className="text-sm text-muted-foreground">{researcher.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {researcher.organization}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                      {researcher.purpose}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="font-medium">{researcher.accessCount} sessions</p>
                      <p className="text-muted-foreground">
                        Last: {new Date(researcher.lastAccess).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      {researcher.tenantId}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notice */}
      <div className="rounded-xl border border-teal/30 bg-teal/5 p-6">
        <div className="flex gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-teal/10">
            <svg className="h-5 w-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-teal">Researcher Tracking Notice</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              All researchers who access this example application are tracked for usage analytics and research purposes. 
              This data helps MEDrecord understand adoption patterns and improve the platform. 
              Researchers consent to tracking when they complete the onboarding process.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
