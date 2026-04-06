/**
 * Task Types
 * 
 * Tasks represent actions to be performed, typically sending questionnaires to patients.
 * Based on FHIR Task resource with HealthTalk extensions.
 */

import type { Task as FHIRTask, Reference } from '@medplum/fhirtypes';

// ============================================
// Delivery Channel Types
// ============================================

/**
 * Available delivery channels for sending questionnaires
 */
export type DeliveryChannel = 
  | 'web'       // Magic link only (patient portal)
  | 'whatsapp'  // WhatsApp via Twilio
  | 'sms'       // SMS via Twilio
  | 'email'     // Email via Postmark
  | 'voice';    // Voice call via ElevenLabs

/**
 * Channel configuration with contact info
 */
export interface ChannelConfig {
  channel: DeliveryChannel;
  /** Contact info for the channel (phone for whatsapp/sms/voice, email for email) */
  contactValue?: string;
  /** Whether this is the primary channel */
  primary?: boolean;
  /** Fallback channel if this one fails */
  fallback?: DeliveryChannel;
}

// ============================================
// Task Status Types
// ============================================

/**
 * Task status following FHIR Task status codes
 */
export type TaskStatus = 
  | 'draft'           // Task created but not sent
  | 'requested'       // Ready to be sent
  | 'received'        // Notification Gateway received it
  | 'accepted'        // Patient acknowledged (opened link)
  | 'in-progress'     // Patient started filling out
  | 'completed'       // Patient submitted response
  | 'failed'          // Delivery failed
  | 'cancelled'       // Admin cancelled
  | 'rejected'        // Patient declined
  | 'on-hold';        // Paused

/**
 * Task priority levels
 */
export type TaskPriority = 'routine' | 'urgent' | 'asap' | 'stat';

// ============================================
// Task Creation Types
// ============================================

/**
 * Request to create a new questionnaire task
 */
export interface CreateQuestionnaireTaskRequest {
  /** Patient to send questionnaire to */
  patientId: string;
  
  /** Questionnaire to send */
  questionnaireId: string;
  
  /** Delivery channel configuration */
  channels: ChannelConfig[];
  
  /** Optional: scheduled send time (ISO 8601) */
  scheduledFor?: string;
  
  /** Optional: due date for completion (ISO 8601) */
  dueDate?: string;
  
  /** Optional: expiration date for the magic link (ISO 8601) */
  expiresAt?: string;
  
  /** Priority level */
  priority?: TaskPriority;
  
  /** Optional: custom message to include in notification */
  customMessage?: string;
  
  /** Optional: language preference for the questionnaire */
  language?: string;
  
  /** Optional: reminder configuration */
  reminders?: ReminderConfig;
}

/**
 * Reminder configuration
 */
export interface ReminderConfig {
  /** Whether reminders are enabled */
  enabled: boolean;
  /** Intervals for reminders (in hours) */
  intervals: number[];
  /** Maximum number of reminders */
  maxReminders?: number;
  /** Channel for reminders (defaults to primary channel) */
  channel?: DeliveryChannel;
}

// ============================================
// Task Response Types
// ============================================

/**
 * Questionnaire task summary for list views
 */
export interface QuestionnaireTaskSummary {
  id: string;
  status: TaskStatus;
  priority: TaskPriority;
  
  /** Patient info */
  patient: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  };
  
  /** Questionnaire info */
  questionnaire: {
    id: string;
    title: string;
    hasScoring: boolean;
  };
  
  /** Primary delivery channel */
  primaryChannel: DeliveryChannel;
  
  /** Timestamps */
  createdAt: string;
  sentAt?: string;
  openedAt?: string;
  completedAt?: string;
  dueDate?: string;
  
  /** Completion info */
  response?: {
    id: string;
    score?: number;
    severity?: string;
  };
}

/**
 * Full task detail with magic link info
 */
export interface QuestionnaireTaskDetail extends QuestionnaireTaskSummary {
  /** Magic link for the patient (only visible before completion) */
  magicLink?: string;
  
  /** Token expiration */
  tokenExpiresAt?: string;
  
  /** Full channel configuration */
  channels: ChannelConfig[];
  
  /** Reminder configuration */
  reminders?: ReminderConfig;
  
  /** Custom message sent to patient */
  customMessage?: string;
  
  /** Language preference */
  language?: string;
  
  /** Delivery attempts */
  deliveryAttempts: DeliveryAttempt[];
  
  /** The underlying FHIR Task resource */
  fhirTask: FHIRTask;
}

/**
 * Record of a delivery attempt
 */
export interface DeliveryAttempt {
  channel: DeliveryChannel;
  attemptedAt: string;
  status: 'success' | 'failed' | 'pending';
  errorMessage?: string;
  messageId?: string;
}

// ============================================
// Task List Response Types
// ============================================

/**
 * Task list response with pagination
 */
export interface QuestionnaireTaskListResponse {
  items: QuestionnaireTaskSummary[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Search parameters for task list
 */
export interface TaskSearchParams {
  /** Filter by status */
  status?: TaskStatus | TaskStatus[];
  /** Filter by patient */
  patientId?: string;
  /** Filter by questionnaire */
  questionnaireId?: string;
  /** Filter by channel */
  channel?: DeliveryChannel;
  /** Filter by due date range */
  dueFrom?: string;
  dueTo?: string;
  /** Filter by created date range */
  createdFrom?: string;
  createdTo?: string;
  /** Search query (patient name, questionnaire title) */
  search?: string;
  /** Pagination */
  page?: number;
  limit?: number;
  /** Sort field */
  sortBy?: 'createdAt' | 'dueDate' | 'status' | 'patient';
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// Magic Link Types
// ============================================

/**
 * Magic link token payload (JWT claims)
 */
export interface MagicLinkPayload {
  /** Task ID */
  taskId: string;
  /** Patient ID */
  patientId: string;
  /** Questionnaire ID */
  questionnaireId: string;
  /** Language preference */
  language?: string;
  /** Issued at timestamp */
  iat: number;
  /** Expiration timestamp */
  exp: number;
  /** Issuer */
  iss: string;
}

/**
 * Validate magic link response
 */
export interface ValidateMagicLinkResponse {
  valid: boolean;
  expired?: boolean;
  completed?: boolean;
  task?: QuestionnaireTaskDetail;
  questionnaire?: {
    id: string;
    title: string;
    description?: string;
    itemCount: number;
    estimatedMinutes?: number;
  };
  patient?: {
    id: string;
    name: string;
    pronoun?: string;
  };
}

// ============================================
// Task Update Types
// ============================================

/**
 * Update task request
 */
export interface UpdateTaskRequest {
  /** Update status */
  status?: TaskStatus;
  /** Update due date */
  dueDate?: string;
  /** Update priority */
  priority?: TaskPriority;
  /** Update custom message */
  customMessage?: string;
  /** Update reminders */
  reminders?: ReminderConfig;
}

/**
 * Resend notification request
 */
export interface ResendNotificationRequest {
  /** Channel to resend on (defaults to primary) */
  channel?: DeliveryChannel;
  /** Optional: updated contact value */
  contactValue?: string;
  /** Optional: updated custom message */
  customMessage?: string;
}

// ============================================
// Task Statistics Types
// ============================================

/**
 * Task statistics for dashboard
 */
export interface TaskStatistics {
  /** Total tasks by status */
  byStatus: Record<TaskStatus, number>;
  /** Completion rate */
  completionRate: number;
  /** Average completion time (in minutes) */
  averageCompletionTime: number;
  /** Tasks due today */
  dueToday: number;
  /** Overdue tasks */
  overdue: number;
  /** Tasks sent today */
  sentToday: number;
}

// ============================================
// Type Guards
// ============================================

export function isDeliveryChannel(value: string): value is DeliveryChannel {
  return ['web', 'whatsapp', 'sms', 'email', 'voice'].includes(value);
}

export function isTaskStatus(value: string): value is TaskStatus {
  return [
    'draft', 'requested', 'received', 'accepted', 
    'in-progress', 'completed', 'failed', 'cancelled', 
    'rejected', 'on-hold'
  ].includes(value);
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get display label for task status
 */
export function getTaskStatusLabel(status: TaskStatus): string {
  const labels: Record<TaskStatus, string> = {
    'draft': 'Concept',
    'requested': 'Verzonden',
    'received': 'Ontvangen',
    'accepted': 'Geopend',
    'in-progress': 'Bezig',
    'completed': 'Voltooid',
    'failed': 'Mislukt',
    'cancelled': 'Geannuleerd',
    'rejected': 'Geweigerd',
    'on-hold': 'Gepauzeerd',
  };
  return labels[status] || status;
}

/**
 * Get display label for delivery channel
 */
export function getChannelLabel(channel: DeliveryChannel): string {
  const labels: Record<DeliveryChannel, string> = {
    'web': 'Web link',
    'whatsapp': 'WhatsApp',
    'sms': 'SMS',
    'email': 'E-mail',
    'voice': 'Telefoon',
  };
  return labels[channel] || channel;
}

/**
 * Get status color for UI
 */
export function getTaskStatusColor(status: TaskStatus): string {
  const colors: Record<TaskStatus, string> = {
    'draft': '#6B7280',      // gray
    'requested': '#3B82F6',  // blue
    'received': '#8B5CF6',   // purple
    'accepted': '#10B981',   // green
    'in-progress': '#F59E0B', // amber
    'completed': '#22C55E',  // green
    'failed': '#EF4444',     // red
    'cancelled': '#6B7280',  // gray
    'rejected': '#EF4444',   // red
    'on-hold': '#F59E0B',    // amber
  };
  return colors[status] || '#6B7280';
}
