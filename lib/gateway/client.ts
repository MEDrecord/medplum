'use server';

/**
 * Gateway Client - Server-Only FHIR Data Access
 * 
 * This client handles all communication with the HealthTalk Gateway.
 * It MUST only be imported in server components, server actions, or API routes.
 * 
 * @see /docs/ARCHITECTURE.md for gateway-first principles
 */

import { cookies } from 'next/headers';
import { gatewayConfig } from './config';
import type { 
  GatewayResponse, 
  GatewayError,
  FHIRBundle,
  FHIRResource,
} from './types';

// ============================================================================
// Gateway Client Class
// ============================================================================

class GatewayClient {
  private baseUrl: string;
  private tenantId: string;

  constructor() {
    this.baseUrl = gatewayConfig.baseUrl;
    this.tenantId = gatewayConfig.tenantId;
  }

  /**
   * Core fetch method - all Gateway requests go through here
   */
  async fetch<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<GatewayResponse<T>> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('medrecord_session');

    const url = `${this.baseUrl}${path}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/fhir+json',
        'Accept': 'application/fhir+json',
        'X-Tenant-ID': this.tenantId,
        ...(sessionCookie && { 
          'Cookie': `session=${sessionCookie.value}` 
        }),
        ...options.headers,
      },
      credentials: 'include',
      // Disable caching for FHIR resources by default
      cache: 'no-store',
    });

    if (!response.ok) {
      const error: GatewayError = {
        status: response.status,
        message: await response.text(),
        path,
        timestamp: new Date().toISOString(),
      };
      throw error;
    }

    return {
      data: await response.json() as T,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
    };
  }

  // ==========================================================================
  // FHIR Operations
  // ==========================================================================

  /**
   * Read a single FHIR resource by ID
   */
  async read<T extends FHIRResource>(
    resourceType: string, 
    id: string
  ): Promise<T> {
    const { data } = await this.fetch<T>(`/fhir/${resourceType}/${id}`);
    return data;
  }

  /**
   * Search FHIR resources with query parameters
   */
  async search<T extends FHIRResource>(
    resourceType: string,
    params: Record<string, string | string[]> = {}
  ): Promise<T[]> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, v));
      } else {
        searchParams.append(key, value);
      }
    });

    const { data } = await this.fetch<FHIRBundle<T>>(
      `/fhir/${resourceType}?${searchParams}`
    );
    
    return data.entry?.map(e => e.resource) ?? [];
  }

  /**
   * Create a new FHIR resource
   */
  async create<T extends FHIRResource>(
    resourceType: string, 
    resource: Omit<T, 'id'>
  ): Promise<T> {
    const { data } = await this.fetch<T>(`/fhir/${resourceType}`, {
      method: 'POST',
      body: JSON.stringify(resource),
    });
    return data;
  }

  /**
   * Update an existing FHIR resource
   */
  async update<T extends FHIRResource>(
    resourceType: string,
    id: string,
    resource: T
  ): Promise<T> {
    const { data } = await this.fetch<T>(`/fhir/${resourceType}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(resource),
    });
    return data;
  }

  /**
   * Delete a FHIR resource
   */
  async delete(resourceType: string, id: string): Promise<void> {
    await this.fetch(`/fhir/${resourceType}/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Execute a FHIR operation (e.g., $validate, $everything)
   */
  async operation<T>(
    resourceType: string,
    operation: string,
    params?: Record<string, unknown>
  ): Promise<T> {
    const { data } = await this.fetch<T>(`/fhir/${resourceType}/${operation}`, {
      method: 'POST',
      body: params ? JSON.stringify(params) : undefined,
    });
    return data;
  }

  // ==========================================================================
  // Agent Operations
  // ==========================================================================

  /**
   * Get all available agent definitions
   */
  async getAgents(): Promise<AgentDefinition[]> {
    const { data } = await this.fetch<AgentDefinition[]>('/api/agents');
    return data;
  }

  /**
   * Get a single agent by ID
   */
  async getAgent(agentId: string): Promise<AgentDefinition> {
    const { data } = await this.fetch<AgentDefinition>(`/api/agents/${agentId}`);
    return data;
  }

  /**
   * Execute an agent
   */
  async executeAgent(
    agentId: string,
    input: Record<string, unknown>
  ): Promise<AgentExecutionResult> {
    const { data } = await this.fetch<AgentExecutionResult>(
      '/api/agents/execute',
      {
        method: 'POST',
        body: JSON.stringify({ agentId, input }),
      }
    );
    return data;
  }

  /**
   * Get agent execution status
   */
  async getAgentExecution(executionId: string): Promise<AgentExecution> {
    const { data } = await this.fetch<AgentExecution>(
      `/api/agents/executions/${executionId}`
    );
    return data;
  }

  // ==========================================================================
  // Researcher Tracking
  // ==========================================================================

  /**
   * Track researcher access (called on login)
   */
  async trackResearcherAccess(userData: {
    email: string;
    name: string;
    organization?: string;
  }): Promise<void> {
    await this.fetch('/api/researchers/track', {
      method: 'POST',
      body: JSON.stringify({
        ...userData,
        accessedAt: new Date().toISOString(),
        source: 'medrecord-example-app',
      }),
    });
  }

  /**
   * Get researcher statistics (admin only)
   */
  async getResearcherStats(): Promise<ResearcherStats> {
    const { data } = await this.fetch<ResearcherStats>('/api/researchers/stats');
    return data;
  }
}

// ============================================================================
// Type Definitions (imported from ./types.ts)
// ============================================================================

interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  triggers: unknown[];
  tools: string[];
  dataAccess: {
    read: string[];
    write: string[];
  };
  workflow: unknown;
}

interface AgentExecutionResult {
  executionId: string;
  status: 'success' | 'failure' | 'partial';
  message: string;
  data?: unknown;
}

interface AgentExecution {
  id: string;
  agentId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  currentNode?: string;
  logs: Array<{ timestamp: string; level: string; message: string }>;
}

interface ResearcherStats {
  totalResearchers: number;
  activeThisWeek: number;
  byOrganization: Record<string, number>;
}

// ============================================================================
// Singleton Export
// ============================================================================

export const gateway = new GatewayClient();

// Also export for direct function usage in server actions
export async function gatewayFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await gateway.fetch<T>(path, options);
  return response.data;
}
