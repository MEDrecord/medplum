import Link from 'next/link'

const agents = [
  {
    id: 'prom-whatsapp-agent',
    name: 'PROM WhatsApp Agent',
    description: 'Sends PROM questionnaires to patients via WhatsApp after appointments',
    status: 'active',
    trigger: 'Appointment Created',
    executions: { today: 32, total: 1247 },
    lastRun: '2 minutes ago',
  },
  {
    id: 'appointment-reminder',
    name: 'Appointment Reminder',
    description: 'Sends 24-hour reminders to patients via WhatsApp',
    status: 'active',
    trigger: 'Schedule (Daily 09:00)',
    executions: { today: 15, total: 892 },
    lastRun: '3 hours ago',
  },
  {
    id: 'care-followup',
    name: 'Care Follow-up Agent',
    description: 'Post-treatment follow-up surveys and care coordination',
    status: 'scheduled',
    trigger: 'Schedule (Daily 18:00)',
    executions: { today: 0, total: 456 },
    lastRun: 'Yesterday 18:00',
  },
  {
    id: 'intake-processor',
    name: 'Patient Intake Processor',
    description: 'Processes intake forms and creates Patient resources in FHIR',
    status: 'inactive',
    trigger: 'QuestionnaireResponse Created',
    executions: { today: 0, total: 234 },
    lastRun: '5 days ago',
  },
]

export default function AgentsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your intelligent healthcare workflow agents
          </p>
        </div>
        <Link
          href="/dashboard/agents/new"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm transition-all hover:bg-accent/90 hover:shadow-md"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Agent
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
          All
        </button>
        <button className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted">
          Active
        </button>
        <button className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted">
          Scheduled
        </button>
        <button className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted">
          Inactive
        </button>
      </div>

      {/* Agent Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {agents.map((agent) => (
          <Link
            key={agent.id}
            href={`/dashboard/agents/${agent.id}`}
            className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                  agent.status === 'active' ? 'bg-teal/10' :
                  agent.status === 'scheduled' ? 'bg-accent/10' : 'bg-muted'
                }`}>
                  <svg className={`h-6 w-6 ${
                    agent.status === 'active' ? 'text-teal' :
                    agent.status === 'scheduled' ? 'text-accent' : 'text-muted-foreground'
                  }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold group-hover:text-primary">{agent.name}</h3>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    agent.status === 'active' ? 'bg-teal/10 text-teal' :
                    agent.status === 'scheduled' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'
                  }`}>
                    {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                  </span>
                </div>
              </div>
              <svg className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>

            <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
              {agent.description}
            </p>

            <div className="mt-4 flex items-center gap-4 border-t border-border pt-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {agent.trigger}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {agent.executions.today} today / {agent.executions.total} total
              </span>
              <span className="text-muted-foreground">
                Last: {agent.lastRun}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
