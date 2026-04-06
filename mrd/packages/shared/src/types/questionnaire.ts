/**
 * Questionnaire Types
 * 
 * Types for FHIR Questionnaires with MEDrecord-specific score configuration.
 * These types extend FHIR R4 Questionnaire with scoring capabilities.
 */

import type { 
  Questionnaire as FHIRQuestionnaire,
  QuestionnaireItem as FHIRQuestionnaireItem,
  QuestionnaireResponse,
  QuestionnaireResponseItem,
  Observation,
  Coding,
} from '@medplum/fhirtypes';

// =============================================================================
// SCORE CONFIGURATION TYPES
// =============================================================================

/**
 * Severity level for score interpretation
 */
export type ScoreSeverity = 'minimal' | 'mild' | 'moderate' | 'moderately-severe' | 'severe';

/**
 * A single score range with interpretation
 */
export interface ScoreRange {
  /** Minimum score (inclusive) */
  min: number;
  /** Maximum score (inclusive) */
  max: number;
  /** Severity level */
  severity: ScoreSeverity;
  /** Display label (e.g., "Minimaal", "Mild", "Matig") */
  label: string;
  /** Optional description for clinicians */
  description?: string;
  /** Color for UI display (hex) */
  color: string;
}

/**
 * Complete score configuration for a questionnaire
 */
export interface ScoreConfiguration {
  /** Whether scoring is enabled */
  enabled: boolean;
  /** Scoring method */
  method: 'sum' | 'average' | 'weighted' | 'custom';
  /** Minimum possible score */
  minScore: number;
  /** Maximum possible score */
  maxScore: number;
  /** Score interpretation ranges */
  ranges: ScoreRange[];
  /** LOINC code for the total score (e.g., "44261-6" for PHQ-9) */
  loincCode?: string;
  /** Display name for the score (e.g., "PHQ-9 Score") */
  displayName?: string;
  /** Custom calculation expression (FHIRPath) for 'custom' method */
  customExpression?: string;
}

/**
 * Default score ranges for common severity levels
 */
export const DEFAULT_SCORE_COLORS: Record<ScoreSeverity, string> = {
  'minimal': '#22C55E',        // Green
  'mild': '#EAB308',           // Yellow
  'moderate': '#F97316',       // Orange
  'moderately-severe': '#EF4444', // Red-Orange
  'severe': '#DC2626',         // Red
};

// =============================================================================
// QUESTIONNAIRE ITEM TYPES
// =============================================================================

/**
 * Question types supported by the builder
 */
export type QuestionType = 
  | 'boolean'       // Yes/No
  | 'decimal'       // Numeric with decimals
  | 'integer'       // Whole number
  | 'date'          // Date picker
  | 'dateTime'      // Date and time
  | 'time'          // Time only
  | 'string'        // Short text
  | 'text'          // Long text (textarea)
  | 'choice'        // Single select
  | 'open-choice'   // Single select with "other" option
  | 'multi-choice'  // Multi select (extension)
  | 'display'       // Read-only text/instructions
  | 'group';        // Container for nested items

/**
 * Answer option with optional score value
 */
export interface AnswerOption {
  /** Unique ID for this option */
  id: string;
  /** Display text */
  text: string;
  /** Value to store (for FHIR valueCoding) */
  value: string | number;
  /** Score value (for scored questionnaires) */
  score?: number;
  /** FHIR Coding for this option */
  coding?: Coding;
}

/**
 * Validation rules for a question
 */
export interface QuestionValidation {
  /** Is this question required? */
  required?: boolean;
  /** Minimum value (for numeric) */
  minValue?: number;
  /** Maximum value (for numeric) */
  maxValue?: number;
  /** Minimum length (for text) */
  minLength?: number;
  /** Maximum length (for text) */
  maxLength?: number;
  /** Regex pattern (for string) */
  pattern?: string;
  /** Minimum selections (for multi-choice) */
  minSelections?: number;
  /** Maximum selections (for multi-choice) */
  maxSelections?: number;
}

/**
 * Conditional display rules (enableWhen)
 */
export interface ConditionalRule {
  /** LinkId of the question to check */
  questionLinkId: string;
  /** Operator for comparison */
  operator: 'exists' | '=' | '!=' | '>' | '<' | '>=' | '<=';
  /** Value to compare against */
  answerValue: string | number | boolean;
}

/**
 * Builder representation of a questionnaire item
 * This is a simplified version for the UI, converted to FHIR on save
 */
export interface QuestionnaireItemBuilder {
  /** Unique identifier (maps to FHIR linkId) */
  id: string;
  /** Question type */
  type: QuestionType;
  /** Question text (clinician view) */
  text: string;
  /** Patient-facing text (optional, for patient view) */
  patientText?: string;
  /** Help text / instructions */
  helpText?: string;
  /** Prefix (e.g., "1.", "a)") */
  prefix?: string;
  /** Validation rules */
  validation?: QuestionValidation;
  /** Answer options (for choice types) */
  options?: AnswerOption[];
  /** Conditional display rules */
  enableWhen?: ConditionalRule[];
  /** Behavior when multiple enableWhen rules (default: 'all') */
  enableBehavior?: 'all' | 'any';
  /** Nested items (for groups) */
  items?: QuestionnaireItemBuilder[];
  /** Initial/default value */
  initialValue?: string | number | boolean;
  /** Read-only (calculated or display only) */
  readOnly?: boolean;
  /** Repeating item (can add multiple answers) */
  repeats?: boolean;
  /** LOINC code for this item */
  loincCode?: string;
  /** Order index for sorting */
  order: number;
}

// =============================================================================
// QUESTIONNAIRE TYPES
// =============================================================================

/**
 * Questionnaire status
 */
export type QuestionnaireStatus = 'draft' | 'active' | 'retired' | 'unknown';

/**
 * Builder representation of a complete questionnaire
 */
export interface QuestionnaireBuilder {
  /** FHIR resource ID (undefined for new questionnaires) */
  id?: string;
  /** Display name */
  name: string;
  /** Title (shown to patients) */
  title: string;
  /** Description */
  description?: string;
  /** Status */
  status: QuestionnaireStatus;
  /** Version string */
  version?: string;
  /** Publication date */
  date?: string;
  /** Publisher organization */
  publisher?: string;
  /** Questionnaire items */
  items: QuestionnaireItemBuilder[];
  /** Score configuration */
  scoreConfig?: ScoreConfiguration;
  /** Supported languages */
  languages: string[];
  /** Primary language */
  primaryLanguage: string;
  /** Tags/categories */
  tags?: string[];
  /** LOINC code for the questionnaire */
  loincCode?: string;
  /** Use subjectType (usually 'Patient') */
  subjectType?: string[];
  /** Approval date */
  approvalDate?: string;
  /** Last review date */
  lastReviewDate?: string;
}

/**
 * Summary view of a questionnaire (for list views)
 */
export interface QuestionnaireSummary {
  id: string;
  name: string;
  title: string;
  status: QuestionnaireStatus;
  version?: string;
  date?: string;
  itemCount: number;
  hasScoring: boolean;
  tags?: string[];
  languages: string[];
  loincCode?: string;
}

// =============================================================================
// SCORE RESULT TYPES
// =============================================================================

/**
 * Calculated score result
 */
export interface ScoreResult {
  /** Total score value */
  totalScore: number;
  /** Maximum possible score */
  maxScore: number;
  /** Percentage (0-100) */
  percentage: number;
  /** Severity interpretation */
  severity: ScoreSeverity;
  /** Display label */
  severityLabel: string;
  /** Color for display */
  color: string;
  /** Individual item scores */
  itemScores?: Array<{
    linkId: string;
    score: number;
    maxScore: number;
  }>;
  /** Reference to the Observation resource (after save) */
  observationId?: string;
}

/**
 * FHIR Observation for score storage
 * This is the shape we create when saving a score
 */
export interface ScoreObservation extends Observation {
  /** Always 'Observation' */
  resourceType: 'Observation';
  /** Status is always 'final' after calculation */
  status: 'final';
  /** Code identifies what score this is */
  code: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  /** Patient reference */
  subject: { reference: string };
  /** Link to QuestionnaireResponse */
  derivedFrom: Array<{ reference: string }>;
  /** The actual score value */
  valueInteger?: number;
  valueQuantity?: {
    value: number;
    unit: string;
    system: string;
    code: string;
  };
  /** Severity interpretation */
  interpretation?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
}

// =============================================================================
// CONVERSION UTILITIES TYPES
// =============================================================================

/**
 * Options for converting builder to FHIR
 */
export interface ToFHIROptions {
  /** Base URL for canonical references */
  baseUrl?: string;
  /** Include score extensions */
  includeScoreExtensions?: boolean;
}

/**
 * Options for converting FHIR to builder
 */
export interface FromFHIROptions {
  /** Extract score config from extensions */
  extractScoreConfig?: boolean;
}

// =============================================================================
// RE-EXPORT FHIR TYPES
// =============================================================================

export type {
  FHIRQuestionnaire,
  FHIRQuestionnaireItem,
  QuestionnaireResponse,
  QuestionnaireResponseItem,
  Observation,
  Coding,
};
