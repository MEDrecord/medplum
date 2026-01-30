# FHIR Backend Integration Strategy

> **Version:** 1.0.0  
> **Last Updated:** January 2026  
> **Status:** Draft

## Overview

This document describes how the MEDrecord example application integrates with FHIR backend systems. The key principle is that **the GUI does not manage its own FHIR database** - all data access flows through the HealthTalk Gateway.

---

## Architecture: FHIR Facade Pattern

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MEDrecord GUI                                 │
│                     (No direct DB access)                            │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            │ HTTPS + X-Tenant-ID
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     HealthTalk Gateway                               │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   Router    │──│  Auth/RBAC  │──│  Aggregator │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
│         │                                   │                        │
│         │         FHIR R4 Interface         │                        │
│         ▼                                   ▼                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                  Backend Connectors                          │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │   │
│  │  │Medplum  │  │ Epic    │  │Chipsoft │  │ HAPI    │        │   │
│  │  │Connector│  │Connector│  │Connector│  │Connector│        │   │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │   │
│  └───────┼───────────┼───────────┼───────────┼────────────────┘   │
└──────────┼───────────┼───────────┼───────────┼────────────────────┘
           │           │           │           │
           ▼           ▼           ▼           ▼
      ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
      │Medplum  │ │  Epic   │ │Chipsoft │ │  HAPI   │
      │  FHIR   │ │  FHIR   │ │  FHIR   │ │  FHIR   │
      │ Server  │ │ Server  │ │ Server  │ │ Server  │
      └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

---

## Why No Local FHIR Database?

### Reasons

1. **Single Source of Truth**: Patient data should live in the EPD/ECD, not duplicated
2. **Compliance**: GDPR/EHDS requires data minimization
3. **Maintenance**: Syncing databases creates complexity and failure points
4. **Security**: Fewer places where sensitive data is stored

### What the Gateway Handles

| Concern | Gateway Responsibility |
|---------|----------------------|
| Authentication | OAuth/OIDC with Azure B2C |
| Authorization | RBAC, tenant isolation |
| Data routing | Which backend serves which resource |
| Transformation | FHIR version mapping (R4/R5) |
| Caching | Response caching with invalidation |
| Audit | Access logging for compliance |

---

## Connecting to FHIR Backends

### Supported Connection Types

#### 1. Direct FHIR R4/R5

Standard FHIR servers with REST API.

```yaml
# Gateway backend configuration
backend:
  type: fhir-r4
  base_url: https://fhir.example.com/fhir/R4
  auth:
    type: oauth2
    token_url: https://auth.example.com/oauth/token
    client_id: ${CLIENT_ID}
    client_secret: ${CLIENT_SECRET}
    scope: "system/*.read system/*.write"
```

#### 2. SMART on FHIR

For EHR systems supporting SMART App Launch (Epic, Cerner).

```yaml
backend:
  type: smart-on-fhir
  iss: https://fhir.epic.com/interconnect-fhir-oauth
  auth:
    type: smart_backend
    client_id: ${EPIC_CLIENT_ID}
    private_key: ${EPIC_PRIVATE_KEY}
```

#### 3. Custom API Adapters

For systems with non-FHIR APIs that need translation.

```yaml
backend:
  type: custom
  adapter: chipsoft-hix
  base_url: https://hospital.chipsoft.nl/api
  auth:
    type: certificate
    cert_file: /certs/client.pem
```

---

## Multi-Backend Routing

The Gateway can route requests to different backends based on rules:

### Resource-Based Routing

```yaml
routing:
  rules:
    # Patients from Epic, clinical data from HAPI
    - resource_type: Patient
      backend: epic
    - resource_type: Observation
      backend: hapi
    - resource_type: Questionnaire
      backend: medplum
    - resource_type: QuestionnaireResponse
      backend: medplum
```

### Tenant-Based Routing

```yaml
routing:
  tenants:
    # Research group A uses Medplum sandbox
    tenant_a:
      default_backend: medplum_sandbox
    
    # Hospital B uses their Epic instance
    tenant_b:
      default_backend: epic_hospital_b
```

### Aggregation

For searches across multiple backends:

```yaml
routing:
  aggregation:
    Patient:
      backends: [epic, chipsoft]
      strategy: merge_dedupe
      dedupe_field: identifier[0].value
```

---

## FHIR Resources for Agents

The PROM WhatsApp Agent requires access to these resources:

### Read Access

| Resource | Purpose | Typical Backend |
|----------|---------|-----------------|
| `Patient` | Get patient demographics, phone number | EPD (Epic/Chipsoft) |
| `Questionnaire` | PROM questionnaire definition | Medplum / Custom |
| `Appointment` | Trigger: appointment scheduled | EPD |
| `CarePlan` | Treatment context | EPD |

### Write Access

| Resource | Purpose | Typical Backend |
|----------|---------|-----------------|
| `Task` | Track questionnaire delivery | Medplum |
| `QuestionnaireResponse` | Store patient answers | Medplum |
| `Communication` | Log WhatsApp messages | Medplum |

### Example: Reading Patient from Any Backend

```typescript
// The GUI code is backend-agnostic
import { gateway } from '@/lib/gateway/client';

// Gateway routes to correct backend based on config
const patient = await gateway.read<Patient>('Patient', 'abc123');

// Extract phone number (works regardless of which EPD)
const phone = patient.telecom?.find(t => t.system === 'phone')?.value;
```

---

## Setting Up a Test Environment

### Option 1: Medplum Sandbox (Recommended for Development)

Medplum provides a free sandbox FHIR server:

1. Create account at https://app.medplum.com
2. Get Client ID and Client Secret
3. Configure in Gateway

```bash
# Gateway environment
FHIR_MEDPLUM_BASE_URL=https://api.medplum.com/fhir/R4
FHIR_MEDPLUM_CLIENT_ID=your-client-id
FHIR_MEDPLUM_CLIENT_SECRET=your-client-secret
```

### Option 2: HAPI FHIR Server (Self-Hosted)

Run a local HAPI FHIR server for testing:

```bash
docker run -p 8080:8080 hapiproject/hapi:latest
```

### Option 3: Mock FHIR Server

For unit testing, use the Gateway's mock mode:

```bash
GATEWAY_MOCK_FHIR=true
```

---

## Data Flow Example: PROM Agent

```
1. Appointment created in Epic
   └─▶ Epic sends webhook to Gateway

2. Gateway receives event
   └─▶ Triggers PROM Agent

3. Agent fetches Patient from Epic
   └─▶ Gateway: GET /fhir/Patient/{id}
   └─▶ Epic returns Patient resource

4. Agent checks for phone number
   └─▶ Found: +31612345678

5. Agent fetches Questionnaire from Medplum
   └─▶ Gateway: GET /fhir/Questionnaire/{id}
   └─▶ Medplum returns PROM questionnaire

6. Agent sends WhatsApp via Gateway
   └─▶ Gateway: POST /api/whatsapp/send
   └─▶ WhatsApp Business API

7. Agent creates Task in Medplum
   └─▶ Gateway: POST /fhir/Task
   └─▶ Medplum stores tracking Task

8. Patient clicks link, fills questionnaire
   └─▶ Response stored in Medplum
   └─▶ QuestionnaireResponse created

9. Gateway notifies Agent of completion
   └─▶ Agent updates Task status
```

---

## Security Considerations

### Data Minimization

Agents should only request the fields they need:

```typescript
// Good: Request only needed fields
const patient = await gateway.search<Patient>('Patient', {
  _id: patientId,
  _elements: 'id,name,telecom',  // Only fetch what's needed
});

// Avoid: Fetching entire resource unnecessarily
```

### Audit Logging

All FHIR operations are logged by the Gateway:

```json
{
  "timestamp": "2026-01-30T10:15:30Z",
  "action": "read",
  "resource_type": "Patient",
  "resource_id": "abc123",
  "user_id": "user-456",
  "tenant_id": "tenant-789",
  "agent_id": "prom-whatsapp-agent",
  "backend": "epic",
  "duration_ms": 145
}
```

### Error Handling

```typescript
import { gateway } from '@/lib/gateway/client';
import type { GatewayError } from '@/lib/gateway/types';

try {
  const patient = await gateway.read<Patient>('Patient', id);
} catch (error) {
  const gatewayError = error as GatewayError;
  
  if (gatewayError.status === 404) {
    // Patient not found
  } else if (gatewayError.status === 403) {
    // No access to this patient
  } else {
    // Unexpected error
    console.error('Gateway error:', gatewayError);
  }
}
```

---

## Next Steps

1. **Configure Gateway backends** for your FHIR servers
2. **Test connectivity** with sample Patient queries
3. **Implement PROM Agent** using the gateway client
4. **Add error handling** for backend failures
5. **Set up monitoring** for FHIR operation metrics

---

## References

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [AGENTS.md](./AGENTS.md) - Agent framework
- [HL7 FHIR R4](https://hl7.org/fhir/R4/) - FHIR specification
- [SMART on FHIR](https://docs.smarthealthit.org/) - EHR integration
- [Medplum](https://www.medplum.com/docs) - Open source FHIR platform
