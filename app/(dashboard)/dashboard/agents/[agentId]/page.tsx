import Link from 'next/link'

// This would come from the Gateway in production
const agent = {
  id: 'prom-whatsapp-agent',
  name: 'PROM WhatsApp Agent',
  description: 'Sends PROM questionnaires to patients via WhatsApp after appointments are scheduled. Automatically retrieves patient contact information and sends personalized questionnaire links.',
  version: '1.2.0',
  status: 'active',
  
  trigger: {
    type: 'fhir-subscription',
    resourceType: 'Appointment',
    criteria: 'status=booked',
  },
  
  tools: [
    { name: 'fhir.read', description: 'Read FHIR resources' },
    { name: 'fhir.create', description: 'Create FHIR resources' },
    { name: 'whatsapp.sendTemplate', description: 'Send WhatsApp template messages' },
    { name: 'logging.info', description: 'Log information messages' },
  ],
  
  dataAccess: {
    read: ['Patient', 'Appointment', 'Questionnaire'],
    write: ['Task', 'Communication', 'QuestionnaireResponse'],
  },
  
  stats: {
    executionsToday: 32,
    executionsTotal: 1247,
    successRate: 98.5,
    avgDuration: '2.3s',
  },
  
  recentExecutions: [
    { id: '1', status: 'success', patient: 'Patient #1234', duration: '1.8s', timestamp: '2 min ago' },
    { id: '2', status: 'success', patient: 'Patient #1233', duration: '2.1s', timestamp: '15 min ago' },
    { id: '3', status: 'success', patient: 'Patient #1232', duration: '2.4s', timestamp: '32 min ago' },
    { id: '4', status: 'failed', patient: 'Patient #1231', duration: '0.5s', timestamp: '45 min ago' },
    { id: '5', status: 'success', patient: 'Patient #1230', duration: '1.9s', timestamp: '1 hr ago' },
  ],
}

export default function AgentDetailPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
        <span>/</span>
        <Link href="/dashboard/agents" className="hover:text-foreground">Agents</Link>
        <span>/</span>
        <span className="text-foreground">{agent.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-teal/10">
            <svg className="h-8 w-8 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{agent.name}</h1>
              <span className="inline-flex items-center rounded-full bg-teal/10 px-2.5 py-1 text-xs font-medium text-teal">
                Active
              </span>
            </div>
            <p className="mt-1 text-muted-foreground">Version {agent.version}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">
            Edit
          </button>
          <button className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition-all hover:bg-accent/90 hover:shadow-md">
            Execute Manually
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="text-muted-foreground">{agent.description}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Executions Today</p>
          <p className="mt-1 text-3xl font-semibold">{agent.stats.executionsToday}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Executions</p>
          <p className="mt-1 text-3xl font-semibold">{agent.stats.executionsTotal.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Success Rate</p>
          <p className="mt-1 text-3xl font-semibold text-teal">{agent.stats.successRate}%</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Avg Duration</p>
          <p className="mt-1 text-3xl font-semibold">{agent.stats.avgDuration}</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Configuration */}
        <div className="space-y-6 lg:col-span-2">
          {/* Trigger */}
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-6 py-4">
              <h2 className="font-semibold">Trigger</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 rounded-lg bg-muted p-4">
                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div>
                  <p className="font-medium">FHIR Subscription</p>
                  <p className="text-sm text-muted-foreground">
                    {agent.trigger.resourceType} where {agent.trigger.criteria}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tools */}
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-6 py-4">
              <h2 className="font-semibold">Available Tools</h2>
            </div>
            <div className="divide-y divide-border">
              {agent.tools.map((tool) => (
                <div key={tool.name} className="flex items-center gap-3 px-6 py-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
                    <svg className="h-4 w-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium font-mono text-sm">{tool.name}</p>
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Data Access */}
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-6 py-4">
              <h2 className="font-semibold">Data Access Policy</h2>
            </div>
            <div className="p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Read Access</p>
                  <div className="flex flex-wrap gap-2">
                    {agent.dataAccess.read.map((resource) => (
                      <span key={resource} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {resource}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Write Access</p>
                  <div className="flex flex-wrap gap-2">
                    {agent.dataAccess.write.map((resource) => (
                      <span key={resource} className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                        {resource}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Executions */}
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-semibold">Recent Executions</h2>
            <Link href={`/dashboard/agents/${agent.id}/history`} className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {agent.recentExecutions.map((execution) => (
              <div key={execution.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {execution.status === 'success' ? (
                      <span className="h-2 w-2 rounded-full bg-teal"></span>
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-red-500"></span>
                    )}
                    <span className="text-sm font-medium">{execution.patient}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{execution.duration}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{execution.timestamp}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Workflow Visualization Placeholder */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-semibold">Workflow Visualization</h2>
        </div>
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <h3 className="font-medium">React Flow Visualization</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Interactive workflow diagram coming in Phase 3
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
