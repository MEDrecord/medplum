# MEDrecord Agent Framework

> **Version:** 1.0.0  
> **Last Updated:** January 2026  
> **Status:** Approved

## Overview

The MEDrecord Agent Framework replaces static screens, fixed workflows, and form-driven software with autonomous, role-aware agents that operate across systems, time, and data boundaries.

**Key Principle:** Do not propose "pages" or "screens." Every feature is defined as an agent-driven workflow with clear triggers, tools, and outcomes.

---

## Agent Definition

An agent is a self-contained unit of intelligence with defined responsibilities:

```typescript
interface AgentDefinition {
  // Identity
  id: string;
  name: string;
  description: string;
  version: string;
  
  // Accountability
  accountableFor: string;  // What outcome is this agent responsible for?
  
  // Triggers - When does this agent act?
  triggers: AgentTrigger[];
  
  // Tools - What can this agent use?
  tools: AgentTool[];
  
  // Data Access - What data can it read/write?
  dataAccess: DataAccessPolicy;
  
  // Workflow - How does it operate?
  workflow: AgentWorkflow;
  
  // Constraints
  requiredRoles: string[];      // Who can execute this agent?
  maxExecutionTime: number;     // Timeout in milliseconds
  retryPolicy: RetryPolicy;
}
```

---

## Agent Components

### 1. Triggers

Triggers define when an agent activates:

```typescript
type AgentTrigger =
  | FHIRSubscriptionTrigger    // FHIR resource event
  | ScheduleTrigger            // Cron-based schedule
  | ManualTrigger              // User-initiated
  | WebhookTrigger             // External webhook
  | AgentCompletionTrigger;    // Another agent finished

interface FHIRSubscriptionTrigger {
  type: 'fhir-subscription';
  resourceType: string;        // e.g., 'QuestionnaireResponse'
  event: 'create' | 'update' | 'delete';
  filter?: string;             // FHIR search parameters
}

interface ScheduleTrigger {
  type: 'schedule';
  cron: string;                // e.g., '0 9 * * *' (daily at 9am)
  timezone: string;
}

interface ManualTrigger {
  type: 'manual';
  requiredInput: InputSchema;  // What data must be provided
}
```

### 2. Tools

Tools are capabilities an agent can use:

```typescript
interface AgentTool {
  id: string;
  name: string;
  description: string;
  
  // Tool category
  category: 
    | 'fhir'           // FHIR operations
    | 'communication'  // WhatsApp, Email, SMS
    | 'ai'             // LLM operations
    | 'external'       // Third-party APIs
    | 'internal';      // Internal utilities
  
  // Input/output schema
  inputSchema: JSONSchema;
  outputSchema: JSONSchema;
  
  // Execution
  execute: (input: unknown, context: AgentContext) => Promise<unknown>;
}
```

**Built-in Tools:**

| Tool | Category | Description |
|------|----------|-------------|
| `fhir.read` | fhir | Read a FHIR resource |
| `fhir.search` | fhir | Search FHIR resources |
| `fhir.create` | fhir | Create a FHIR resource |
| `fhir.update` | fhir | Update a FHIR resource |
| `whatsapp.send` | communication | Send WhatsApp message |
| `whatsapp.sendTemplate` | communication | Send WhatsApp template message |
| `email.send` | communication | Send email |
| `llm.generate` | ai | Generate text with LLM |
| `llm.extract` | ai | Extract structured data |

### 3. Data Access Policy

Defines what data an agent can access:

```typescript
interface DataAccessPolicy {
  // FHIR resource permissions
  fhir: {
    read: string[];    // Resource types agent can read
    write: string[];   // Resource types agent can write
    search: string[];  // Resource types agent can search
  };
  
  // Scope restrictions
  scope: 
    | 'patient'        // Only patient's own data
    | 'practitioner'   // Data of assigned patients
    | 'organization'   // All data in organization
    | 'tenant';        // All data in tenant
  
  // Field-level restrictions
  fieldRestrictions?: {
    [resourceType: string]: {
      exclude: string[];  // Fields to redact
    };
  };
}
```

### 4. Agent Context

Runtime context provided to every agent execution:

```typescript
interface AgentContext {
  // Execution metadata
  executionId: string;
  startedAt: Date;
  
  // User context (who triggered this)
  user: {
    id: string;
    tenantId: string;
    fhirRoles: string[];
    operationalRoles: string[];
  };
  
  // Trigger context (what triggered this)
  trigger: {
    type: string;
    payload: unknown;
  };
  
  // Gateway client (pre-configured)
  gateway: GatewayClient;
  
  // Logging
  log: AgentLogger;
}
```

---

## Agent Workflow

Workflows are defined as directed graphs executed by the agent runtime:

```typescript
interface AgentWorkflow {
  // Graph definition
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  
  // Entry point
  startNodeId: string;
  
  // Variables available during execution
  variables: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean' | 'object' | 'array';
      default?: unknown;
    };
  };
}

type WorkflowNode =
  | TriggerNode
  | ConditionNode
  | ActionNode
  | ToolNode
  | WaitNode
  | OutcomeNode;

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;  // Expression that must be true
  label?: string;
}
```

### Node Types

```typescript
interface TriggerNode {
  type: 'trigger';
  id: string;
  data: {
    triggerType: string;
    outputVariable: string;  // Where to store trigger data
  };
}

interface ConditionNode {
  type: 'condition';
  id: string;
  data: {
    expression: string;      // Boolean expression
    trueOutput: string;      // Edge to follow if true
    falseOutput: string;     // Edge to follow if false
  };
}

interface ActionNode {
  type: 'action';
  id: string;
  data: {
    toolId: string;          // Which tool to use
    input: Record<string, string>;  // Input mapping (variable references)
    outputVariable: string;  // Where to store result
  };
}

interface WaitNode {
  type: 'wait';
  id: string;
  data: {
    waitFor: 
      | { type: 'duration'; milliseconds: number }
      | { type: 'event'; eventType: string; timeout: number };
  };
}

interface OutcomeNode {
  type: 'outcome';
  id: string;
  data: {
    status: 'success' | 'failure' | 'partial';
    message: string;
    outputVariable?: string;
  };
}
```

---

## Example Agent: PROM Questionnaire via WhatsApp

This agent sends a PROM (Patient-Reported Outcome Measure) questionnaire to a patient via WhatsApp.

### Agent Definition

```typescript
const promQuestionnaireAgent: AgentDefinition = {
  id: 'prom-questionnaire-whatsapp',
  name: 'PROM Questionnaire Sender',
  description: 'Sends PROM questionnaires to patients via WhatsApp and tracks responses',
  version: '1.0.0',
  
  accountableFor: 'Delivering PROM questionnaires to patients and collecting responses',
  
  triggers: [
    {
      type: 'manual',
      requiredInput: {
        type: 'object',
        properties: {
          patientId: { type: 'string', description: 'FHIR Patient ID' },
          questionnaireId: { type: 'string', description: 'FHIR Questionnaire ID' },
        },
        required: ['patientId', 'questionnaireId'],
      },
    },
    {
      type: 'schedule',
      cron: '0 9 * * 1',  // Every Monday at 9am
      timezone: 'Europe/Amsterdam',
    },
    {
      type: 'fhir-subscription',
      resourceType: 'CarePlan',
      event: 'create',
      filter: 'category=prom',
    },
  ],
  
  tools: [
    'fhir.read',
    'fhir.search',
    'fhir.create',
    'whatsapp.sendTemplate',
  ],
  
  dataAccess: {
    fhir: {
      read: ['Patient', 'Questionnaire', 'CarePlan', 'QuestionnaireResponse'],
      write: ['Task', 'Communication', 'QuestionnaireResponse'],
      search: ['Patient', 'QuestionnaireResponse'],
    },
    scope: 'organization',
  },
  
  requiredRoles: ['Practitioner', 'Admin'],
  maxExecutionTime: 30000,
  retryPolicy: {
    maxRetries: 3,
    backoffMs: 1000,
  },
  
  workflow: {
    startNodeId: 'trigger',
    variables: {
      patient: { type: 'object' },
      questionnaire: { type: 'object' },
      phoneNumber: { type: 'string' },
      messageId: { type: 'string' },
    },
    nodes: [
      {
        type: 'trigger',
        id: 'trigger',
        data: {
          triggerType: 'manual',
          outputVariable: 'triggerData',
        },
      },
      {
        type: 'action',
        id: 'fetch-patient',
        data: {
          toolId: 'fhir.read',
          input: {
            resourceType: '"Patient"',
            id: 'triggerData.patientId',
          },
          outputVariable: 'patient',
        },
      },
      {
        type: 'action',
        id: 'fetch-questionnaire',
        data: {
          toolId: 'fhir.read',
          input: {
            resourceType: '"Questionnaire"',
            id: 'triggerData.questionnaireId',
          },
          outputVariable: 'questionnaire',
        },
      },
      {
        type: 'condition',
        id: 'has-phone',
        data: {
          expression: 'patient.telecom?.find(t => t.system === "phone")?.value',
          trueOutput: 'extract-phone',
          falseOutput: 'no-phone-outcome',
        },
      },
      {
        type: 'action',
        id: 'extract-phone',
        data: {
          toolId: 'internal.extract',
          input: {
            expression: 'patient.telecom.find(t => t.system === "phone").value',
          },
          outputVariable: 'phoneNumber',
        },
      },
      {
        type: 'action',
        id: 'send-whatsapp',
        data: {
          toolId: 'whatsapp.sendTemplate',
          input: {
            to: 'phoneNumber',
            template: '"prom_questionnaire_invite"',
            parameters: {
              patientName: 'patient.name[0].given[0]',
              questionnaireName: 'questionnaire.title',
              link: '`${config.baseUrl}/questionnaire/${questionnaire.id}?patient=${patient.id}`',
            },
          },
          outputVariable: 'messageId',
        },
      },
      {
        type: 'action',
        id: 'create-task',
        data: {
          toolId: 'fhir.create',
          input: {
            resourceType: '"Task"',
            resource: {
              resourceType: 'Task',
              status: 'requested',
              intent: 'order',
              code: {
                coding: [{
                  system: 'http://medrecord.com/task-type',
                  code: 'complete-questionnaire',
                }],
              },
              for: { reference: '`Patient/${patient.id}`' },
              focus: { reference: '`Questionnaire/${questionnaire.id}`' },
              note: [{ text: '`WhatsApp message sent: ${messageId}`' }],
            },
          },
          outputVariable: 'task',
        },
      },
      {
        type: 'outcome',
        id: 'success-outcome',
        data: {
          status: 'success',
          message: 'PROM questionnaire sent successfully',
          outputVariable: 'task',
        },
      },
      {
        type: 'outcome',
        id: 'no-phone-outcome',
        data: {
          status: 'failure',
          message: 'Patient has no phone number on file',
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'trigger', target: 'fetch-patient' },
      { id: 'e2', source: 'fetch-patient', target: 'fetch-questionnaire' },
      { id: 'e3', source: 'fetch-questionnaire', target: 'has-phone' },
      { id: 'e4', source: 'has-phone', target: 'extract-phone', condition: 'true', label: 'Has phone' },
      { id: 'e5', source: 'has-phone', target: 'no-phone-outcome', condition: 'false', label: 'No phone' },
      { id: 'e6', source: 'extract-phone', target: 'send-whatsapp' },
      { id: 'e7', source: 'send-whatsapp', target: 'create-task' },
      { id: 'e8', source: 'create-task', target: 'success-outcome' },
    ],
  },
};
```

### Visual Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                  PROM Questionnaire Agent                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐                                                │
│  │   Trigger   │ (Manual / Schedule / CarePlan Created)         │
│  └──────┬──────┘                                                │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────┐                                                │
│  │Fetch Patient│ → fhir.read(Patient)                           │
│  └──────┬──────┘                                                │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────┐                                           │
│  │Fetch Questionnaire│ → fhir.read(Questionnaire)               │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│    ┌─────────────┐                                              │
│    │ Has Phone?  │                                              │
│    └──────┬──────┘                                              │
│      ┌────┴────┐                                                │
│      │         │                                                │
│     Yes        No                                               │
│      │         │                                                │
│      ▼         ▼                                                │
│ ┌──────────┐  ┌──────────────┐                                  │
│ │ Extract  │  │   Outcome:   │                                  │
│ │  Phone   │  │   FAILURE    │                                  │
│ └────┬─────┘  │ (no phone)   │                                  │
│      │        └──────────────┘                                  │
│      ▼                                                          │
│ ┌──────────────────┐                                            │
│ │ Send WhatsApp    │ → whatsapp.sendTemplate                    │
│ │ (PROM invite)    │                                            │
│ └────────┬─────────┘                                            │
│          │                                                       │
│          ▼                                                       │
│ ┌──────────────────┐                                            │
│ │ Create Task      │ → fhir.create(Task)                        │
│ │ (track response) │                                            │
│ └────────┬─────────┘                                            │
│          │                                                       │
│          ▼                                                       │
│ ┌──────────────────┐                                            │
│ │    Outcome:      │                                            │
│ │    SUCCESS       │                                            │
│ └──────────────────┘                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Agent Registry

Agents are registered in the Gateway backend. The GUI fetches available agents:

```typescript
// lib/agents/registry.ts
import { gateway } from '@/lib/gateway/client';

export async function getAvailableAgents(): Promise<AgentDefinition[]> {
  const response = await gateway.fetch<AgentDefinition[]>('/api/agents');
  return response.data;
}

export async function getAgent(agentId: string): Promise<AgentDefinition> {
  const response = await gateway.fetch<AgentDefinition>(`/api/agents/${agentId}`);
  return response.data;
}
```

---

## Agent Execution

### Server-Side Execution

Agents execute on the server via API routes:

```typescript
// app/api/agents/execute/route.ts
import { NextResponse } from 'next/server';
import { gateway } from '@/lib/gateway/client';
import { getSession } from '@/lib/auth/session';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { agentId, input } = await request.json();

  // Execute via Gateway
  const response = await gateway.fetch('/api/agents/execute', {
    method: 'POST',
    body: JSON.stringify({
      agentId,
      input,
      userId: session.user.id,
    }),
  });

  return NextResponse.json(response.data);
}
```

### Execution Status

Track long-running agent executions:

```typescript
interface AgentExecution {
  id: string;
  agentId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  currentNode?: string;
  variables: Record<string, unknown>;
  logs: AgentLogEntry[];
  outcome?: {
    status: 'success' | 'failure' | 'partial';
    message: string;
    data?: unknown;
  };
}
```

---

## Best Practices

### Do

- Define clear accountability for each agent
- Use FHIR resources for data persistence
- Implement proper error handling in workflows
- Log all significant actions for audit
- Use WhatsApp templates for patient communication
- Set appropriate timeouts and retry policies

### Don't

- Create agents without clear triggers and outcomes
- Access data outside the defined data access policy
- Hardcode configuration values
- Skip validation of user input
- Ignore role-based access control

---

## References

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [REACT-FLOW-INTEGRATION.md](./REACT-FLOW-INTEGRATION.md) - Workflow visualization
- [FHIR R4 Specification](https://hl7.org/fhir/R4/) - FHIR resource definitions
