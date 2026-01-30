# MEDrecord Implementation Plan

> **Version:** 1.0.0  
> **Last Updated:** January 2026  
> **Target:** Example Project for Healthcare Researchers

## Executive Summary

This document outlines the implementation plan for the MEDrecord example application. The project serves as a reference implementation for researchers exploring agent-driven healthcare workflows with multi-tenant support.

**Key Objectives:**

1. Demonstrate gateway-first architecture patterns
2. Provide working PROM agent with WhatsApp integration
3. Track all researchers using the example application
4. Support multi-tenant deployment for isolated research environments

---

## Phase Overview

| Phase | Name | Duration | Deliverables |
|-------|------|----------|--------------|
| 0 | Foundation | Week 1 | Project setup, gateway client, env config |
| 1 | Authentication | Week 2 | OAuth flow, session management, researcher tracking |
| 2 | Agent Framework | Week 3 | Base agent types, executor, registry |
| 3 | React Flow | Week 4 | Workflow visualization, custom nodes |
| 4 | PROM Agent | Week 5 | WhatsApp integration, questionnaire flow |
| 5 | Multi-Tenant | Week 6 | Tenant isolation, researcher dashboard |

---

## Phase 0: Foundation

### Objective

Bootstrap the Next.js application with gateway-first architecture and zero hardcoded values.

### Tasks

#### 0.1 Project Initialization

```bash
# Create Next.js app (if not exists)
npx create-next-app@latest medrecord-gui --typescript --tailwind --app

# Install dependencies
npm install @xyflow/react swr zod
npm install -D @types/node
```

#### 0.2 Environment Configuration

Create configuration without hardcoding:

```typescript
// lib/gateway/config.ts
import 'server-only';

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const gatewayConfig = {
  get baseUrl() {
    return requireEnv('MEDRECORD_GATEWAY_URL');
  },
  get tenantId() {
    return requireEnv('MEDRECORD_TENANT_ID');
  },
  get clientId() {
    return requireEnv('MEDRECORD_CLIENT_ID');
  },
  get appUrl() {
    return requireEnv('NEXT_PUBLIC_APP_URL');
  },
} as const;
```

#### 0.3 Gateway Client Implementation

```typescript
// lib/gateway/client.ts
import 'server-only';
import { cookies } from 'next/headers';
import { gatewayConfig } from './config';
import type { GatewayResponse, GatewayError } from './types';

export async function gatewayFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const cookieStore = await cookies();
  const session = cookieStore.get('medrecord_session');

  const url = `${gatewayConfig.baseUrl}${path}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': gatewayConfig.tenantId,
      ...(session && { 'Cookie': `session=${session.value}` }),
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error: GatewayError = {
      status: response.status,
      message: await response.text(),
      path,
    };
    throw error;
  }

  return response.json();
}
```

#### 0.4 Type Definitions

```typescript
// lib/gateway/types.ts
export interface GatewayError {
  status: number;
  message: string;
  path: string;
}

export interface GatewayResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
  };
}

export interface TenantConfig {
  id: string;
  name: string;
  features: string[];
  branding?: {
    logo?: string;
    primaryColor?: string;
  };
}
```

### Deliverables

- [ ] Next.js project structure created
- [ ] Environment validation on startup
- [ ] Gateway client with type safety
- [ ] No hardcoded values in codebase

---

## Phase 1: Authentication & Researcher Tracking

### Objective

Implement OAuth flow with the HealthTalk Gateway and track all researchers who access the application.

### Researcher Tracking Model

Every user who accesses the example app is tracked as a "Researcher":

```typescript
// lib/auth/types.ts
export interface Researcher {
  id: string;                     // Gateway user ID
  email: string;
  name: string;
  organization?: string;
  
  // Tracking metadata
  firstAccessAt: string;          // ISO timestamp
  lastAccessAt: string;
  accessCount: number;
  
  // Research context
  tenantId: string;               // Assigned research tenant
  purpose?: string;               // Self-reported research purpose
  
  // Consent
  acceptedTermsAt?: string;
  marketingConsent: boolean;
}
```

### Tasks

#### 1.1 Login Page

```typescript
// app/(auth)/login/page.tsx
import { redirect } from 'next/navigation';
import { gatewayConfig } from '@/lib/gateway/config';

export default function LoginPage() {
  const loginUrl = new URL('/api/auth/signin', gatewayConfig.baseUrl);
  loginUrl.searchParams.set('client_id', gatewayConfig.clientId);
  loginUrl.searchParams.set('redirect_uri', `${gatewayConfig.appUrl}/api/auth/callback`);
  loginUrl.searchParams.set('response_type', 'code');
  loginUrl.searchParams.set('scope', 'openid profile email');
  
  redirect(loginUrl.toString());
}
```

#### 1.2 OAuth Callback Handler

```typescript
// app/api/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { gatewayFetch } from '@/lib/gateway/client';
import { trackResearcherAccess } from '@/lib/auth/researcher-tracking';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  
  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', request.url));
  }

  try {
    // Exchange code for session with Gateway
    const session = await gatewayFetch<SessionResponse>('/api/auth/token', {
      method: 'POST',
      body: JSON.stringify({ 
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
      }),
    });

    // Track researcher access
    await trackResearcherAccess(session.user);

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('medrecord_session', session.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
  }
}
```

#### 1.3 Researcher Tracking Service

```typescript
// lib/auth/researcher-tracking.ts
import 'server-only';
import { gatewayFetch } from '@/lib/gateway/client';
import type { Researcher, GatewayUser } from './types';

export async function trackResearcherAccess(user: GatewayUser): Promise<void> {
  // Record access in Gateway backend
  await gatewayFetch('/api/researchers/track', {
    method: 'POST',
    body: JSON.stringify({
      userId: user.id,
      email: user.email,
      name: user.name,
      accessedAt: new Date().toISOString(),
      userAgent: headers().get('user-agent'),
      source: 'medrecord-example-app',
    }),
  });
}

export async function getResearcherStats(): Promise<ResearcherStats> {
  return gatewayFetch<ResearcherStats>('/api/researchers/stats');
}

export async function listResearchers(
  options?: { page?: number; limit?: number }
): Promise<Researcher[]> {
  const params = new URLSearchParams();
  if (options?.page) params.set('page', String(options.page));
  if (options?.limit) params.set('limit', String(options.limit));
  
  return gatewayFetch<Researcher[]>(`/api/researchers?${params}`);
}
```

#### 1.4 First-Time User Onboarding

New researchers must provide context on first access:

```typescript
// app/(auth)/onboarding/page.tsx
// Collects: organization, research purpose, terms acceptance
```

### Deliverables

- [ ] OAuth login flow working
- [ ] Session cookie management
- [ ] Researcher tracking on every login
- [ ] First-time onboarding flow
- [ ] Researcher list endpoint for admins

---

## Phase 2: Agent Framework

### Objective

Implement the core agent types, registry, and execution engine.

### Tasks

#### 2.1 Agent Type Definitions

```typescript
// lib/agents/types.ts
export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  
  // Trigger configuration
  triggers: AgentTrigger[];
  
  // Available tools
  tools: AgentToolReference[];
  
  // Data access policy
  dataAccess: DataAccessPolicy;
  
  // Expected outcome
  outcome: string;
  
  // React Flow workflow
  workflow: WorkflowDefinition;
}

export type AgentTrigger = 
  | { type: 'fhir-subscription'; resourceType: string; criteria?: string }
  | { type: 'schedule'; cron: string }
  | { type: 'manual'; allowedRoles: string[] }
  | { type: 'event'; eventName: string };

export interface AgentToolReference {
  name: string;
  version?: string;
  config?: Record<string, unknown>;
}

export interface DataAccessPolicy {
  read: ResourceAccess[];
  write: ResourceAccess[];
}

export interface ResourceAccess {
  resourceType: string;
  scope: 'own' | 'tenant' | 'all';
  fields?: string[];  // Field-level access control
}
```

#### 2.2 Agent Registry

```typescript
// lib/agents/registry.ts
import 'server-only';
import { gatewayFetch } from '@/lib/gateway/client';
import type { AgentDefinition } from './types';

class AgentRegistry {
  private cache: Map<string, AgentDefinition> = new Map();
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getAll(): Promise<AgentDefinition[]> {
    if (this.isCacheValid()) {
      return Array.from(this.cache.values());
    }

    const agents = await gatewayFetch<AgentDefinition[]>('/api/agents/definitions');
    
    this.cache.clear();
    agents.forEach(agent => this.cache.set(agent.id, agent));
    this.cacheExpiry = Date.now() + this.CACHE_TTL;

    return agents;
  }

  async getById(id: string): Promise<AgentDefinition | null> {
    await this.ensureLoaded();
    return this.cache.get(id) ?? null;
  }

  private isCacheValid(): boolean {
    return this.cacheExpiry > Date.now() && this.cache.size > 0;
  }

  private async ensureLoaded(): Promise<void> {
    if (!this.isCacheValid()) {
      await this.getAll();
    }
  }
}

export const agentRegistry = new AgentRegistry();
```

#### 2.3 Agent Executor

```typescript
// lib/agents/executor.ts
import 'server-only';
import { gatewayFetch } from '@/lib/gateway/client';
import { agentRegistry } from './registry';
import type { AgentDefinition, AgentExecutionRequest, AgentExecutionResult } from './types';

export async function executeAgent(
  agentId: string,
  input: Record<string, unknown>,
  context: { userId: string; tenantId: string }
): Promise<AgentExecutionResult> {
  const agent = await agentRegistry.getById(agentId);
  
  if (!agent) {
    throw new Error(`Agent not found: ${agentId}`);
  }

  // Validate input against agent schema
  validateAgentInput(agent, input);

  // Execute via Gateway (server-side)
  const result = await gatewayFetch<AgentExecutionResult>('/api/agents/execute', {
    method: 'POST',
    body: JSON.stringify({
      agentId,
      input,
      context: {
        userId: context.userId,
        tenantId: context.tenantId,
        timestamp: new Date().toISOString(),
      },
    }),
  });

  return result;
}

function validateAgentInput(agent: AgentDefinition, input: Record<string, unknown>): void {
  // Validation logic based on agent.workflow.inputSchema
}
```

### Deliverables

- [ ] Agent type definitions complete
- [ ] Registry fetching from Gateway
- [ ] Executor with validation
- [ ] Server-side only enforcement

---

## Phase 3: React Flow Integration

### Objective

Build the workflow visualization layer using React Flow (open source).

### Tasks

#### 3.1 Custom Node Types

```typescript
// components/flow/nodes/TriggerNode.tsx
// components/flow/nodes/ActionNode.tsx
// components/flow/nodes/ConditionNode.tsx
// components/flow/nodes/OutcomeNode.tsx
```

#### 3.2 Workflow Canvas

```typescript
// components/flow/AgentFlowCanvas.tsx
'use client';

import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { TriggerNode } from './nodes/TriggerNode';
import { ActionNode } from './nodes/ActionNode';
import { ConditionNode } from './nodes/ConditionNode';
import { OutcomeNode } from './nodes/OutcomeNode';

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  outcome: OutcomeNode,
};
```

#### 3.3 Workflow Definition Converter

```typescript
// lib/agents/workflow-converter.ts
// Converts AgentDefinition.workflow to React Flow nodes/edges
```

### Deliverables

- [ ] All custom node types
- [ ] Canvas with controls
- [ ] Workflow converter
- [ ] Real-time execution state visualization

---

## Phase 4: PROM Agent Implementation

### Objective

Build the proof-of-concept agent that sends PROM questionnaires to patients via WhatsApp.

### Workflow

```
[Trigger: Appointment Scheduled]
          │
          ▼
[Get Patient Details] ──▶ [Gateway: FHIR Patient]
          │
          ▼
[Check Phone Number]
    │         │
    ▼         ▼
[Has Phone] [No Phone]
    │         │
    ▼         ▼
[Send WhatsApp] [Log Warning]
    │
    ▼
[Create Task: Follow-up]
    │
    ▼
[Outcome: PROM Sent]
```

### Tasks

#### 4.1 Agent Definition

```typescript
// Gateway stores this definition
const promAgent: AgentDefinition = {
  id: 'prom-whatsapp-agent',
  name: 'PROM WhatsApp Agent',
  description: 'Sends PROM questionnaires to patients via WhatsApp after appointments',
  version: '1.0.0',
  
  triggers: [
    {
      type: 'fhir-subscription',
      resourceType: 'Appointment',
      criteria: 'status=booked',
    },
  ],
  
  tools: [
    { name: 'fhir.read' },
    { name: 'fhir.create' },
    { name: 'whatsapp.sendTemplate' },
    { name: 'logging.warn' },
  ],
  
  dataAccess: {
    read: [
      { resourceType: 'Patient', scope: 'tenant' },
      { resourceType: 'Appointment', scope: 'tenant' },
      { resourceType: 'Questionnaire', scope: 'tenant' },
    ],
    write: [
      { resourceType: 'Task', scope: 'own' },
      { resourceType: 'Communication', scope: 'own' },
    ],
  },
  
  outcome: 'PROM questionnaire sent to patient via WhatsApp',
  
  workflow: { /* React Flow definition */ },
};
```

#### 4.2 WhatsApp Tool Implementation (Gateway-side)

The actual WhatsApp integration happens in the Gateway:

```typescript
// Gateway backend handles this
// Tool: whatsapp.sendTemplate
{
  name: 'whatsapp.sendTemplate',
  description: 'Send a WhatsApp template message',
  inputSchema: {
    phoneNumber: 'string',
    templateName: 'string',
    templateParams: 'Record<string, string>',
    language: 'string',
  },
}
```

#### 4.3 Agent Execution UI

```typescript
// app/(dashboard)/agents/[agentId]/execute/page.tsx
// Manual execution interface for testing
```

### Deliverables

- [ ] PROM agent definition in Gateway
- [ ] WhatsApp tool integration
- [ ] Manual execution UI
- [ ] Execution history view

---

## Phase 5: Multi-Tenant Support

### Objective

Enable isolated research environments for different researchers/organizations.

### Multi-Tenant Model

```
┌─────────────────────────────────────────────────────────────┐
│                    MEDrecord Platform                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Tenant A   │  │  Tenant B   │  │  Tenant C   │         │
│  │  (Research  │  │  (Hospital  │  │  (Clinic    │         │
│  │   Group 1)  │  │   Study)    │  │   Demo)     │         │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤         │
│  │ - Agents    │  │ - Agents    │  │ - Agents    │         │
│  │ - Patients  │  │ - Patients  │  │ - Patients  │         │
│  │ - Config    │  │ - Config    │  │ - Config    │         │
│  │ - Users     │  │ - Users     │  │ - Users     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
│  All tenants share:                                         │
│  - Gateway infrastructure                                    │
│  - Agent framework                                           │
│  - Core FHIR resources                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Tasks

#### 5.1 Tenant Context

```typescript
// lib/tenant/context.ts
import 'server-only';
import { cookies } from 'next/headers';
import { gatewayFetch } from '@/lib/gateway/client';
import type { TenantConfig } from './types';

export async function getCurrentTenant(): Promise<TenantConfig> {
  return gatewayFetch<TenantConfig>('/api/tenant/current');
}

export async function getTenantBranding(): Promise<TenantBranding> {
  const tenant = await getCurrentTenant();
  return tenant.branding ?? defaultBranding;
}
```

#### 5.2 Tenant Switching (for admins)

```typescript
// app/(dashboard)/admin/tenants/page.tsx
// Admin interface to view and manage research tenants
```

#### 5.3 Researcher Dashboard

```typescript
// app/(dashboard)/admin/researchers/page.tsx
// View all researchers who have accessed the platform
```

### Deliverables

- [ ] Tenant context provider
- [ ] Tenant-specific branding
- [ ] Admin tenant management
- [ ] Researcher activity dashboard

---

## Getting Started

### Prerequisites

1. Access to HealthTalk Gateway (staging environment)
2. Tenant ID and Client ID from MEDrecord admin
3. Node.js 20+ installed

### Initial Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd medrecord-gui

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env.local

# 4. Configure environment variables
# Edit .env.local with your credentials

# 5. Start development server
npm run dev
```

### Environment Variables

```bash
# .env.local
MEDRECORD_GATEWAY_URL=https://auth-test-b2c.healthtalk.ai
MEDRECORD_TENANT_ID=your-tenant-id
MEDRECORD_CLIENT_ID=your-client-id
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### First Steps

1. **Phase 0**: Set up gateway client and verify connection
2. **Phase 1**: Implement login flow and test authentication
3. **Phase 2**: Fetch agent definitions from Gateway
4. **Phase 3**: Visualize a sample workflow with React Flow
5. **Phase 4**: Execute the PROM agent manually
6. **Phase 5**: Test with multiple tenant configurations

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Authentication success rate | > 99% |
| Agent execution latency | < 5s |
| Researcher tracking coverage | 100% |
| Multi-tenant isolation | Complete data separation |
| Zero hardcoded values | Verified in CI/CD |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Gateway downtime | Implement retry logic, show graceful errors |
| WhatsApp rate limits | Queue messages, respect rate limits |
| Session expiry | Refresh tokens, redirect to login |
| Tenant data leakage | Enforce X-Tenant-ID on all requests |

---

## References

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [AGENTS.md](./AGENTS.md) - Agent framework
- [REACT-FLOW-INTEGRATION.md](./REACT-FLOW-INTEGRATION.md) - Workflow UI
