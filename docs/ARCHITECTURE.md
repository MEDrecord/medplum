# MEDrecord Architecture

> **Version:** 1.0.0  
> **Last Updated:** January 2026  
> **Status:** Approved

## Overview

MEDrecord is an intelligent, agent-driven layer around existing healthcare systems (EPDs/ECDs). This document describes the gateway-first architecture that enables secure, role-aware data access through modern desktop applications.

## Core Principles

### 1. Gateway-First (Non-Negotiable)

All data access flows through the HealthTalk Gateway. Direct database access from frontend components is strictly forbidden.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js GUI   │────▶│  Next.js API    │────▶│ HealthTalk      │
│   (Browser)     │     │  Routes/Actions │     │ Gateway         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │                        │
                              │ Server-only            │
                              │ No client imports      │
                              ▼                        ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │ Session/Cookie  │     │ EPD/ECD/FHIR    │
                        │ Management      │     │ Data Sources    │
                        └─────────────────┘     └─────────────────┘
```

### 2. Agentic Framework

Features are not pages or CRUD endpoints. Every feature is defined by:

- **Which agents** are responsible
- **Which tools** they can use
- **Which events** trigger them
- **Which data** they read/write via the gateway
- **What outcome** they are accountable for

### 3. FHIR Facade

External-facing contracts use FHIR-compatible semantics. Internal implementations remain optimized and flexible.

### 4. Privacy by Design

All designs must comply with EHDS regulations and implement Privacy Enhancing Technologies (PET).

---

## Authentication Architecture

### Session-Based Auth for GUI

The GUI uses session-based authentication with cookie forwarding through the Next.js server.

```
┌──────────────────────────────────────────────────────────────────┐
│                        AUTH FLOW                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. User clicks "Login"                                          │
│     └──▶ Redirect to Gateway /api/auth/signin                    │
│                                                                   │
│  2. Gateway handles Azure B2C OAuth                              │
│     └──▶ User authenticates with identity provider               │
│                                                                   │
│  3. Gateway redirects to Next.js /api/auth/callback              │
│     └──▶ Gateway provides session token                          │
│                                                                   │
│  4. Next.js API stores session, sets HttpOnly cookie             │
│     └──▶ Cookie: medrecord_session (HttpOnly, Secure, SameSite)  │
│                                                                   │
│  5. All subsequent requests:                                      │
│     Browser ──▶ Next.js API ──▶ Gateway                          │
│     (cookie)    (forward)      (validate)                        │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Identity Model

Every user is represented as a FHIR Person with roles:

```typescript
interface UserIdentity {
  id: string;                    // Unique user identifier
  tenantId: string;              // Tenant/organization scope
  
  // FHIR-compatible roles
  fhirRoles: Array<
    | 'Patient'
    | 'Practitioner'
    | 'RelatedPerson'
    | 'CareTeam'
  >;
  
  // Operational roles
  operationalRoles: Array<
    | 'Admin'
    | 'Developer'
    | 'Operator'
    | 'Auditor'
  >;
  
  // Permissions derived from roles
  permissions: string[];
}
```

---

## Gateway Client

### Configuration (Environment Variables)

All configuration is externalized. No hardcoded values.

```bash
# Required
HEALTHTALK_GATEWAY_URL=https://auth-test-b2c.healthtalk.ai
HEALTHTALK_TENANT_ID=<tenant-uuid>
HEALTHTALK_CLIENT_ID=<client-uuid>

# Optional (development only)
HEALTHTALK_API_KEY=cak_...  # Server-to-server testing
```

### Server-Only Client

```typescript
// lib/gateway/client.ts
// This file MUST NOT be imported in client components

import 'server-only';
import { cookies } from 'next/headers';
import { gatewayConfig } from './config';

export class GatewayClient {
  private baseUrl: string;
  private tenantId: string;

  constructor() {
    this.baseUrl = gatewayConfig.baseUrl;
    this.tenantId = gatewayConfig.tenantId;
  }

  async fetch<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<GatewayResponse<T>> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('medrecord_session');

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': this.tenantId,
        'Cookie': sessionCookie ? `session=${sessionCookie.value}` : '',
        ...options.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new GatewayError(response.status, await response.text());
    }

    return {
      data: await response.json(),
      status: response.status,
    };
  }

  // FHIR resource operations
  async readResource<T>(resourceType: string, id: string): Promise<T> {
    const { data } = await this.fetch<T>(`/fhir/${resourceType}/${id}`);
    return data;
  }

  async searchResources<T>(
    resourceType: string,
    params: Record<string, string>
  ): Promise<T[]> {
    const searchParams = new URLSearchParams(params);
    const { data } = await this.fetch<{ entry: Array<{ resource: T }> }>(
      `/fhir/${resourceType}?${searchParams}`
    );
    return data.entry?.map(e => e.resource) ?? [];
  }

  async createResource<T>(resourceType: string, resource: T): Promise<T> {
    const { data } = await this.fetch<T>(`/fhir/${resourceType}`, {
      method: 'POST',
      body: JSON.stringify(resource),
    });
    return data;
  }
}

export const gateway = new GatewayClient();
```

---

## Project Structure

```
/medrecord-gui/
├── app/
│   ├── (auth)/                      # Auth routes (no layout)
│   │   ├── login/page.tsx           # Redirect to Gateway OAuth
│   │   ├── callback/page.tsx        # Handle OAuth callback
│   │   └── logout/page.tsx          # Clear session
│   │
│   ├── (dashboard)/                 # Protected routes
│   │   ├── layout.tsx               # Auth guard + role context
│   │   ├── page.tsx                 # Dashboard home
│   │   ├── agents/                  # Agent management
│   │   │   ├── page.tsx             # Agent overview
│   │   │   └── [agentId]/
│   │   │       ├── page.tsx         # Agent detail + workflow
│   │   │       └── execute/page.tsx # Manual execution
│   │   └── patients/                # Patient-related features
│   │       └── page.tsx
│   │
│   └── api/                         # API routes (server-only)
│       ├── auth/
│       │   ├── callback/route.ts    # OAuth callback handler
│       │   ├── session/route.ts     # Session management
│       │   └── logout/route.ts      # Session termination
│       ├── gateway/
│       │   └── [...path]/route.ts   # Gateway proxy
│       └── agents/
│           ├── execute/route.ts     # Agent execution endpoint
│           └── status/route.ts      # Execution status
│
├── lib/
│   ├── gateway/                     # Server-only gateway access
│   │   ├── client.ts                # Gateway client class
│   │   ├── config.ts                # Environment config
│   │   └── types.ts                 # Gateway types
│   │
│   ├── auth/                        # Authentication utilities
│   │   ├── session.ts               # Session management
│   │   ├── guards.ts                # Role-based guards
│   │   └── context.tsx              # Auth context provider
│   │
│   └── agents/                      # Agent framework
│       ├── types.ts                 # Agent type definitions
│       ├── registry.ts              # Agent registry
│       └── executor.ts              # Server-side execution
│
├── components/
│   ├── flow/                        # React Flow components
│   │   ├── nodes/                   # Custom node types
│   │   ├── edges/                   # Custom edge types
│   │   └── AgentFlowCanvas.tsx      # Main canvas component
│   │
│   └── ui/                          # shadcn/ui components
│       └── (imported from shared design system)
│
└── docs/
    ├── ARCHITECTURE.md              # This document
    ├── AGENTS.md                    # Agent framework spec
    └── REACT-FLOW-INTEGRATION.md    # Workflow visualization
```

---

## Security Requirements

### Mandatory Rules

| Rule | Implementation |
|------|----------------|
| No API keys in frontend | All secrets in server-only env vars |
| No direct database access | All data via Gateway proxy |
| Auth on every request | Server Actions validate session |
| Tenant isolation | X-Tenant-ID header on every call |
| Role enforcement | Guards at route and component level |
| Audit logging | All agent executions logged |

### Forbidden Patterns

```typescript
// FORBIDDEN: Direct Supabase/DB import in client component
import { createClient } from '@supabase/supabase-js';  // ❌

// FORBIDDEN: API key in client code
const API_KEY = 'cak_xxx';  // ❌

// FORBIDDEN: Hardcoded URLs
fetch('https://auth-test-b2c.healthtalk.ai/...');  // ❌

// CORRECT: Use server action
'use server';
import { gateway } from '@/lib/gateway/client';
export async function getPatient(id: string) {
  return gateway.readResource('Patient', id);
}
```

---

## Integration Points

### HealthTalk Gateway Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/signin` | GET | Initiate OAuth flow |
| `/api/auth/callback` | GET | OAuth callback |
| `/api/auth/session` | GET | Get current session |
| `/api/auth/signout` | POST | End session |
| `/fhir/{resourceType}` | GET/POST | FHIR operations |
| `/api/agents/execute` | POST | Execute agent |
| `/api/agents/status/{id}` | GET | Execution status |

### External Integrations

Agents can integrate with external services through the Gateway:

- **WhatsApp Business API** - Patient communication
- **Email Services** - Notifications
- **Calendar APIs** - Appointment scheduling
- **Document Storage** - File management

---

## Deployment

### Environment Configuration

```bash
# Production
HEALTHTALK_GATEWAY_URL=https://gateway.healthtalk.ai
HEALTHTALK_TENANT_ID=${TENANT_ID}
HEALTHTALK_CLIENT_ID=${CLIENT_ID}
NODE_ENV=production

# Staging
HEALTHTALK_GATEWAY_URL=https://auth-test-b2c.healthtalk.ai
HEALTHTALK_TENANT_ID=${TENANT_ID}
HEALTHTALK_CLIENT_ID=${CLIENT_ID}
NODE_ENV=staging
```

### Build Checks

The build process must fail if:

1. Any hardcoded CSS is present
2. Inline styles are used outside the design system
3. Direct database imports exist in client code
4. Environment variables are missing

---

## References

- [AGENTS.md](./AGENTS.md) - Agent framework specification
- [REACT-FLOW-INTEGRATION.md](./REACT-FLOW-INTEGRATION.md) - Workflow visualization
- [HealthTalk Gateway API](https://auth-test-b2c.healthtalk.ai/docs) - API documentation
