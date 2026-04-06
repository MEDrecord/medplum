/**
 * GatewayClient - HTTP client for MEDrecord Gateway
 * 
 * Supports dual-mode authentication:
 * - Cookie mode: Same-domain authentication via HttpOnly cookie (auth.sid)
 * - WebToken mode: Cross-domain authentication via X-Session-Id header
 * 
 * @see mrd/.agents/specs/gateway-service.mdx
 */

import type { AuthMode } from '../auth/types';
import { resolveAuthMode, isCrossDomain } from '../auth/config';
import { getSessionId } from '../auth/storage';

export type BrandId = 'healthtalk' | 'coachi' | 'medsafe' | 'medrecord';

export interface GatewayClientOptions {
  /** Gateway URL (e.g., https://auth-test-b2c.healthtalk.ai) */
  gatewayUrl: string;
  /** Brand identifier */
  brand: BrandId;
  /** Default service slug for API calls */
  serviceSlug?: string;
  /** Authentication mode (auto-detected if not specified) */
  authMode?: AuthMode;
  /** Session ID for webToken mode (auto-fetched from storage if not provided) */
  sessionId?: string;
}

export class GatewayError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown
  ) {
    super(message);
    this.name = 'GatewayError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class GatewayClient {
  private readonly gatewayUrl: string;
  private readonly brand: BrandId;
  private readonly defaultServiceSlug: string;
  private readonly authMode: 'cookie' | 'webtoken';
  private sessionId?: string;

  constructor(options: GatewayClientOptions) {
    this.gatewayUrl = options.gatewayUrl.replace(/\/$/, ''); // Remove trailing slash
    this.brand = options.brand;
    this.defaultServiceSlug = options.serviceSlug ?? 'templates';
    this.authMode = resolveAuthMode(options.authMode);
    this.sessionId = options.sessionId;
  }

  /**
   * Set session ID for webToken mode (call after token exchange)
   */
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  /**
   * Get current auth mode
   */
  getAuthMode(): 'cookie' | 'webtoken' {
    return this.authMode;
  }

  /**
   * Get auth headers based on current mode
   */
  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {};
    
    if (this.authMode === 'webtoken') {
      // WebToken mode: use X-Session-Id header
      const sessionId = this.sessionId ?? getSessionId();
      if (sessionId) {
        headers['X-Session-Id'] = sessionId;
      }
    }
    
    return headers;
  }

  /**
   * Get credentials option based on auth mode
   */
  private getCredentials(): RequestCredentials {
    return this.authMode === 'cookie' ? 'include' : 'omit';
  }

  /**
   * Make a request through the Gateway proxy
   */
  private async fetch<T>(
    path: string,
    init?: RequestInit & { serviceSlug?: string }
  ): Promise<T> {
    const serviceSlug = init?.serviceSlug ?? this.defaultServiceSlug;
    const url = `${this.gatewayUrl}/api/gateway/proxy/${serviceSlug}${path}`;

    const response = await fetch(url, {
      ...init,
      credentials: this.getCredentials(),
      headers: {
        'Content-Type': 'application/json',
        'X-Brand': this.brand,
        ...this.getAuthHeaders(),
        ...init?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new GatewayError(
        response.status,
        error.code ?? 'GATEWAY_ERROR',
        error.message ?? `Request failed with status ${response.status}`,
        error.details
      );
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // ============================================
  // Auth Methods
  // ============================================

  /**
   * Get current session info
   */
  async getSession(): Promise<SessionInfo | null> {
    try {
      return await this.fetchDirect<SessionInfo>('/api/auth/session');
    } catch {
      return null;
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    await this.fetchDirect<void>('/api/auth/logout', { method: 'POST' });
  }

  /**
   * Direct Gateway request (not proxied to backend service)
   */
  private async fetchDirect<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${this.gatewayUrl}${path}`;

    const response = await fetch(url, {
      ...init,
      credentials: this.getCredentials(),
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...init?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new GatewayError(
        response.status,
        error.code ?? 'GATEWAY_ERROR',
        error.message ?? `Request failed with status ${response.status}`,
        error.details
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // ============================================
  // Templates API
  // ============================================

  templates = {
    /**
     * List templates with optional filters
     */
    list: (params?: TemplateSearchParams): Promise<TemplateListResponse> => {
      const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return this.fetch<TemplateListResponse>(`/${query}`, { serviceSlug: 'templates' });
    },

    /**
     * Get template by ID
     */
    get: (id: string): Promise<TemplateDetailResponse> => {
      return this.fetch<TemplateDetailResponse>(`/${id}/`, { serviceSlug: 'templates' });
    },

    /**
     * Create new template
     */
    create: (data: CreateTemplateRequest): Promise<TemplateDetailResponse> => {
      return this.fetch<TemplateDetailResponse>('/', {
        method: 'POST',
        body: JSON.stringify(data),
        serviceSlug: 'templates',
      });
    },

    /**
     * Update template
     */
    update: (id: string, data: UpdateTemplateRequest): Promise<TemplateDetailResponse> => {
      return this.fetch<TemplateDetailResponse>(`/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        serviceSlug: 'templates',
      });
    },

    /**
     * Delete template
     */
    delete: (id: string): Promise<void> => {
      return this.fetch<void>(`/${id}/`, {
        method: 'DELETE',
        serviceSlug: 'templates',
      });
    },

    /**
     * Publish template
     */
    publish: (id: string): Promise<TemplateDetailResponse> => {
      return this.fetch<TemplateDetailResponse>(`/${id}/publish/`, {
        method: 'POST',
        serviceSlug: 'templates',
      });
    },
  };

  // ============================================
  // Sections API
  // ============================================

  sections = {
    /**
     * List sections for a template
     */
    list: (templateId: string): Promise<SectionListResponse> => {
      return this.fetch<SectionListResponse>(`/${templateId}/sections/`, { serviceSlug: 'templates' });
    },

    /**
     * Create section
     */
    create: (templateId: string, data: CreateSectionRequest): Promise<SectionResponse> => {
      return this.fetch<SectionResponse>(`/${templateId}/sections/`, {
        method: 'POST',
        body: JSON.stringify(data),
        serviceSlug: 'templates',
      });
    },

    /**
     * Update section
     */
    update: (templateId: string, sectionId: string, data: UpdateSectionRequest): Promise<SectionResponse> => {
      return this.fetch<SectionResponse>(`/${templateId}/sections/${sectionId}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        serviceSlug: 'templates',
      });
    },

    /**
     * Delete section
     */
    delete: (templateId: string, sectionId: string): Promise<void> => {
      return this.fetch<void>(`/${templateId}/sections/${sectionId}/`, {
        method: 'DELETE',
        serviceSlug: 'templates',
      });
    },

    /**
     * Reorder sections
     */
    reorder: (templateId: string, sectionIds: string[]): Promise<SectionListResponse> => {
      return this.fetch<SectionListResponse>(`/${templateId}/sections/reorder/`, {
        method: 'POST',
        body: JSON.stringify({ section_ids: sectionIds }),
        serviceSlug: 'templates',
      });
    },
  };

  // ============================================
  // Questionnaires API
  // ============================================

  questionnaires = {
    /**
     * Get questionnaire by ID
     */
    get: (id: string): Promise<QuestionnaireResponse> => {
      return this.fetch<QuestionnaireResponse>(`/${id}/`, { serviceSlug: 'questionnaires' });
    },

    /**
     * Submit questionnaire response
     */
    submitResponse: (questionnaireId: string, response: QuestionnaireSubmitRequest): Promise<QuestionnaireSubmitResponse> => {
      return this.fetch<QuestionnaireSubmitResponse>(`/${questionnaireId}/responses/`, {
        method: 'POST',
        body: JSON.stringify(response),
        serviceSlug: 'questionnaires',
      });
    },
  };

  // ============================================
  // Appointments API
  // ============================================

  appointments = {
    /**
     * List appointments
     */
    list: (params?: AppointmentSearchParams): Promise<AppointmentListResponse> => {
      const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return this.fetch<AppointmentListResponse>(`/${query}`, { serviceSlug: 'appointments' });
    },

    /**
     * Get appointment by ID
     */
    get: (id: string): Promise<AppointmentDetailResponse> => {
      return this.fetch<AppointmentDetailResponse>(`/${id}/`, { serviceSlug: 'appointments' });
    },
  };

  // ============================================
  // Notifications API
  // ============================================

  notifications = {
    /**
     * Send notification via channel
     */
    send: (request: SendNotificationRequest): Promise<void> => {
      return this.fetch<void>('/', {
        method: 'POST',
        body: JSON.stringify(request),
        serviceSlug: 'notifications',
      });
    },
  };
}

// ============================================
// Types
// ============================================

export interface SessionInfo {
  user: {
    id: string;
    email: string;
    name: string;
  };
  tenant: {
    id: string;
    name: string;
  };
  expiresAt: string;
}

export interface TemplateSearchParams {
  status?: 'draft' | 'published';
  type?: 'note-template' | 'questionnaire';
  category?: string;
  search?: string;
  page?: string;
  limit?: string;
}

export interface TemplateListResponse {
  items: TemplateSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface TemplateSummary {
  id: string;
  title: string;
  type: 'note-template' | 'questionnaire';
  category: string;
  status: 'draft' | 'published';
  language: string;
  updatedAt: string;
}

export interface TemplateDetailResponse {
  id: string;
  title: string;
  description: string;
  type: 'note-template' | 'questionnaire';
  category: string;
  status: 'draft' | 'published';
  language: string;
  sections?: SectionResponse[];
  questionnaire?: import('@medplum/fhirtypes').Questionnaire;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateRequest {
  title: string;
  description?: string;
  type: 'note-template' | 'questionnaire';
  category: string;
  language?: string;
}

export interface UpdateTemplateRequest {
  title?: string;
  description?: string;
  category?: string;
  language?: string;
}

export interface SectionListResponse {
  items: SectionResponse[];
}

export interface SectionResponse {
  id: string;
  title: string;
  aiGuidance: string;
  order: number;
  isRequired: boolean;
}

export interface CreateSectionRequest {
  title: string;
  aiGuidance: string;
  isRequired?: boolean;
}

export interface UpdateSectionRequest {
  title?: string;
  aiGuidance?: string;
  isRequired?: boolean;
  order?: number;
}

export interface QuestionnaireResponse {
  id: string;
  questionnaire: import('@medplum/fhirtypes').Questionnaire;
}

export interface QuestionnaireSubmitRequest {
  response: import('@medplum/fhirtypes').QuestionnaireResponse;
}

export interface QuestionnaireSubmitResponse {
  id: string;
  score?: number;
  interpretation?: string;
}

export interface AppointmentSearchParams {
  status?: string;
  date?: string;
  patientId?: string;
}

export interface AppointmentListResponse {
  items: AppointmentSummary[];
  total: number;
}

export interface AppointmentSummary {
  id: string;
  patientName: string;
  date: string;
  status: string;
  templateId?: string;
}

export interface AppointmentDetailResponse extends AppointmentSummary {
  notes?: string;
  summary?: string;
}

export interface SendNotificationRequest {
  taskId: string;
  channel: 'whatsapp' | 'sms' | 'email' | 'voice';
  recipient: string;
}
