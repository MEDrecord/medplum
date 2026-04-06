import type { Questionnaire } from '@medplum/fhirtypes';

/**
 * Template Types
 * 
 * Types for the template system (note templates and questionnaires).
 * 
 * @see mrd/apps/healthtalk/.agents/specs/template-system.mdx
 */

export type TemplateType = 'note-template' | 'questionnaire';
export type TemplateStatus = 'draft' | 'published';

export interface TemplateSummary {
  id: string;
  title: string;
  type: TemplateType;
  category: string;
  status: TemplateStatus;
  language: string;
  updatedAt: string;
}

export interface TemplateDetail {
  id: string;
  title: string;
  description: string;
  type: TemplateType;
  category: string;
  status: TemplateStatus;
  language: string;
  visibility: 'organization' | 'public';
  version: number;
  sections?: TemplateSection[];
  questionnaire?: Questionnaire;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface TemplateSection {
  id: string;
  title: string;
  aiGuidance: string;
  order: number;
  isRequired: boolean;
}

export interface CreateTemplateInput {
  title: string;
  description?: string;
  type: TemplateType;
  category: string;
  language?: string;
}

export interface UpdateTemplateInput {
  title?: string;
  description?: string;
  category?: string;
  language?: string;
}

export interface CreateSectionInput {
  title: string;
  aiGuidance: string;
  isRequired?: boolean;
}

export interface UpdateSectionInput {
  title?: string;
  aiGuidance?: string;
  isRequired?: boolean;
  order?: number;
}

/**
 * Template categories
 */
export const TEMPLATE_CATEGORIES = [
  { value: 'intake', label: 'Intake' },
  { value: 'follow-up', label: 'Follow-up' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'screening', label: 'Screening' },
  { value: 'discharge', label: 'Discharge' },
  { value: 'general', label: 'General' },
] as const;

export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number]['value'];
