/**
 * Appointment Types
 * 
 * Types for appointments and consultations.
 */

export type AppointmentStatus = 
  | 'scheduled'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'no-show';

export interface AppointmentSummary {
  id: string;
  patientId: string;
  patientName: string;
  practitionerId: string;
  practitionerName: string;
  date: string;
  time: string;
  duration: number; // minutes
  status: AppointmentStatus;
  templateId?: string;
  templateTitle?: string;
}

export interface AppointmentDetail extends AppointmentSummary {
  notes?: string;
  summary?: SummarySection[];
  recording?: {
    url: string;
    duration: number;
    transcriptUrl?: string;
  };
  questionnaireTaskId?: string;
  questionnaireStatus?: 'pending' | 'sent' | 'completed';
}

export interface SummarySection {
  id: string;
  title: string;
  content: string;
  status: 'generating' | 'completed' | 'error';
}

export interface RegenerateSummaryRequest {
  appointmentId: string;
  sectionId?: string; // If provided, only regenerate this section
}

export interface RegenerateSummaryResponse {
  taskId: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  progress?: number;
}
