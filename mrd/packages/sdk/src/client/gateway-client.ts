/**
 * GatewayClient - HTTP client for MEDrecord Gateway
 * 
 * The Gateway handles authentication via session cookies.
 * All requests include credentials automatically.
 * 
 * @see mrd/.agents/specs/gateway-service.mdx
 */

export type BrandId = 'healthtalk' | 'coachi' | 'medsafe' | 'medrecord';

export interface GatewayClientOptions {
  /** Gateway URL (e.g., https://auth-test-b2c.healthtalk.ai) */
  gatewayUrl: string;
  /** Brand identifier */
  brand: BrandId;
  /** Default service slug for API calls */
  serviceSlug?: string;
}

export class GatewayError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'GatewayError';
  }
}

export class GatewayClient {
  private readonly gatewayUrl: string;
  private readonly brand: BrandId;
  private readonly defaultServiceSlug: string;

  constructor(options: GatewayClientOptions) {
    this.gatewayUrl = options.gatewayUrl.replace(/\/$/, ''); // Remove trailing slash
    this.brand = options.brand;
    this.defaultServiceSlug = options.serviceSlug ?? 'templates';
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
      credentials: 'include', // Include session cookies
      headers: {
        'Content-Type': 'application/json',
        'X-Brand': this.brand,
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
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
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
  // Questionnaires API (FHIR Questionnaire CRUD)
  // ============================================

  questionnaires = {
    /**
     * List questionnaires with optional filters
     */
    list: (params?: QuestionnaireSearchParams): Promise<QuestionnaireListResponse> => {
      const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return this.fetch<QuestionnaireListResponse>(`/${query}`, { serviceSlug: 'questionnaires' });
    },

    /**
     * Get questionnaire by ID
     */
    get: (id: string): Promise<QuestionnaireDetailResponse> => {
      return this.fetch<QuestionnaireDetailResponse>(`/${id}/`, { serviceSlug: 'questionnaires' });
    },

    /**
     * Create new questionnaire
     */
    create: (data: CreateQuestionnaireRequest): Promise<QuestionnaireDetailResponse> => {
      return this.fetch<QuestionnaireDetailResponse>('/', {
        method: 'POST',
        body: JSON.stringify(data),
        serviceSlug: 'questionnaires',
      });
    },

    /**
     * Update questionnaire
     */
    update: (id: string, data: UpdateQuestionnaireRequest): Promise<QuestionnaireDetailResponse> => {
      return this.fetch<QuestionnaireDetailResponse>(`/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        serviceSlug: 'questionnaires',
      });
    },

    /**
     * Delete questionnaire (only draft)
     */
    delete: (id: string): Promise<void> => {
      return this.fetch<void>(`/${id}/`, {
        method: 'DELETE',
        serviceSlug: 'questionnaires',
      });
    },

    /**
     * Publish questionnaire (draft -> active)
     */
    publish: (id: string): Promise<QuestionnaireDetailResponse> => {
      return this.fetch<QuestionnaireDetailResponse>(`/${id}/publish/`, {
        method: 'POST',
        serviceSlug: 'questionnaires',
      });
    },

    /**
     * Retire questionnaire (active -> retired)
     */
    retire: (id: string): Promise<QuestionnaireDetailResponse> => {
      return this.fetch<QuestionnaireDetailResponse>(`/${id}/retire/`, {
        method: 'POST',
        serviceSlug: 'questionnaires',
      });
    },

    /**
     * Duplicate questionnaire
     */
    duplicate: (id: string): Promise<QuestionnaireDetailResponse> => {
      return this.fetch<QuestionnaireDetailResponse>(`/${id}/duplicate/`, {
        method: 'POST',
        serviceSlug: 'questionnaires',
      });
    },

    /**
     * Import questionnaire from LOINC code
     */
    importFromLoinc: (loincCode: string): Promise<QuestionnaireDetailResponse> => {
      return this.fetch<QuestionnaireDetailResponse>('/import/loinc/', {
        method: 'POST',
        body: JSON.stringify({ loincCode }),
        serviceSlug: 'questionnaires',
      });
    },

    /**
     * Submit questionnaire response (patient completes form)
     */
    submitResponse: (questionnaireId: string, response: QuestionnaireSubmitRequest): Promise<QuestionnaireSubmitResponse> => {
      return this.fetch<QuestionnaireSubmitResponse>(`/${questionnaireId}/responses/`, {
        method: 'POST',
        body: JSON.stringify(response),
        serviceSlug: 'questionnaires',
      });
    },

    /**
     * Get questionnaire response by ID
     */
    getResponse: (questionnaireId: string, responseId: string): Promise<QuestionnaireResponseDetail> => {
      return this.fetch<QuestionnaireResponseDetail>(`/${questionnaireId}/responses/${responseId}/`, {
        serviceSlug: 'questionnaires',
      });
    },

    /**
     * List responses for a questionnaire
     */
    listResponses: (questionnaireId: string, params?: ResponseSearchParams): Promise<QuestionnaireResponseListResponse> => {
      const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return this.fetch<QuestionnaireResponseListResponse>(`/${questionnaireId}/responses/${query}`, {
        serviceSlug: 'questionnaires',
      });
    },

    /**
     * Calculate score for a response (server-side calculation)
     */
    calculateScore: (questionnaireId: string, responseId: string): Promise<ScoreCalculationResponse> => {
      return this.fetch<ScoreCalculationResponse>(`/${questionnaireId}/responses/${responseId}/score/`, {
        method: 'POST',
        serviceSlug: 'questionnaires',
      });
    },

    /**
     * Get score observation for a response
     */
    getScoreObservation: (questionnaireId: string, responseId: string): Promise<ScoreObservationResponse> => {
      return this.fetch<ScoreObservationResponse>(`/${questionnaireId}/responses/${responseId}/score/`, {
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

// Questionnaire Types
export interface QuestionnaireSearchParams {
  status?: 'draft' | 'active' | 'retired';
  hasScoring?: 'true' | 'false';
  search?: string;
  tags?: string;
  page?: string;
  limit?: string;
}

export interface QuestionnaireListResponse {
  items: QuestionnaireSummaryItem[];
  total: number;
  page: number;
  limit: number;
}

export interface QuestionnaireSummaryItem {
  id: string;
  name: string;
  title: string;
  status: 'draft' | 'active' | 'retired';
  version?: string;
  date?: string;
  itemCount: number;
  hasScoring: boolean;
  tags?: string[];
  languages: string[];
  loincCode?: string;
}

export interface QuestionnaireDetailResponse {
  id: string;
  questionnaire: import('@medplum/fhirtypes').Questionnaire;
  scoreConfig?: import('@mrd/shared').ScoreConfiguration;
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    version: string;
  };
}

export interface CreateQuestionnaireRequest {
  name: string;
  title: string;
  description?: string;
  items: import('@mrd/shared').QuestionnaireItemBuilder[];
  scoreConfig?: import('@mrd/shared').ScoreConfiguration;
  languages?: string[];
  tags?: string[];
  loincCode?: string;
}

export interface UpdateQuestionnaireRequest {
  name?: string;
  title?: string;
  description?: string;
  items?: import('@mrd/shared').QuestionnaireItemBuilder[];
  scoreConfig?: import('@mrd/shared').ScoreConfiguration;
  languages?: string[];
  tags?: string[];
}

export interface QuestionnaireSubmitRequest {
  response: import('@medplum/fhirtypes').QuestionnaireResponse;
  patientId: string;
}

export interface QuestionnaireSubmitResponse {
  id: string;
  responseId: string;
  score?: ScoreCalculationResponse;
}

export interface QuestionnaireResponseDetail {
  id: string;
  response: import('@medplum/fhirtypes').QuestionnaireResponse;
  score?: ScoreCalculationResponse;
  submittedAt: string;
  patientId: string;
}

export interface QuestionnaireResponseListResponse {
  items: Array<{
    id: string;
    patientId: string;
    patientName: string;
    submittedAt: string;
    score?: number;
    severity?: string;
  }>;
  total: number;
  page: number;
  limit: number;
}

export interface ResponseSearchParams {
  patientId?: string;
  from?: string;
  to?: string;
  page?: string;
  limit?: string;
}

export interface ScoreCalculationResponse {
  totalScore: number;
  maxScore: number;
  percentage: number;
  severity: string;
  severityLabel: string;
  color: string;
  observationId?: string;
}

export interface ScoreObservationResponse {
  observation: import('@medplum/fhirtypes').Observation;
  score: ScoreCalculationResponse;
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
