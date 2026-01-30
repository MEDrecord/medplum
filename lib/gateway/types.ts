/**
 * Gateway Type Definitions
 * 
 * Type definitions for Gateway communication and FHIR resources.
 * These types ensure type safety throughout the application.
 */

// ============================================================================
// Gateway Response Types
// ============================================================================

export interface GatewayResponse<T> {
  data: T;
  status: number;
  headers?: Record<string, string>;
}

export interface GatewayError {
  status: number;
  message: string;
  path: string;
  timestamp: string;
  code?: string;
}

// ============================================================================
// FHIR Base Types
// ============================================================================

export interface FHIRResource {
  resourceType: string;
  id?: string;
  meta?: FHIRMeta;
}

export interface FHIRMeta {
  versionId?: string;
  lastUpdated?: string;
  source?: string;
  profile?: string[];
  security?: FHIRCoding[];
  tag?: FHIRCoding[];
}

export interface FHIRCoding {
  system?: string;
  version?: string;
  code?: string;
  display?: string;
  userSelected?: boolean;
}

export interface FHIRCodeableConcept {
  coding?: FHIRCoding[];
  text?: string;
}

export interface FHIRReference {
  reference?: string;
  type?: string;
  identifier?: FHIRIdentifier;
  display?: string;
}

export interface FHIRIdentifier {
  use?: 'usual' | 'official' | 'temp' | 'secondary' | 'old';
  type?: FHIRCodeableConcept;
  system?: string;
  value?: string;
  period?: FHIRPeriod;
  assigner?: FHIRReference;
}

export interface FHIRPeriod {
  start?: string;
  end?: string;
}

export interface FHIRHumanName {
  use?: 'usual' | 'official' | 'temp' | 'nickname' | 'anonymous' | 'old' | 'maiden';
  text?: string;
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
  period?: FHIRPeriod;
}

export interface FHIRContactPoint {
  system?: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other';
  value?: string;
  use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
  rank?: number;
  period?: FHIRPeriod;
}

export interface FHIRAddress {
  use?: 'home' | 'work' | 'temp' | 'old' | 'billing';
  type?: 'postal' | 'physical' | 'both';
  text?: string;
  line?: string[];
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  period?: FHIRPeriod;
}

// ============================================================================
// FHIR Bundle
// ============================================================================

export interface FHIRBundle<T extends FHIRResource = FHIRResource> {
  resourceType: 'Bundle';
  id?: string;
  meta?: FHIRMeta;
  type: 'document' | 'message' | 'transaction' | 'transaction-response' | 
        'batch' | 'batch-response' | 'history' | 'searchset' | 'collection';
  timestamp?: string;
  total?: number;
  link?: FHIRBundleLink[];
  entry?: FHIRBundleEntry<T>[];
}

export interface FHIRBundleLink {
  relation: string;
  url: string;
}

export interface FHIRBundleEntry<T extends FHIRResource = FHIRResource> {
  fullUrl?: string;
  resource: T;
  search?: {
    mode?: 'match' | 'include' | 'outcome';
    score?: number;
  };
}

// ============================================================================
// FHIR Resource Types (commonly used)
// ============================================================================

export interface Patient extends FHIRResource {
  resourceType: 'Patient';
  identifier?: FHIRIdentifier[];
  active?: boolean;
  name?: FHIRHumanName[];
  telecom?: FHIRContactPoint[];
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  address?: FHIRAddress[];
  contact?: PatientContact[];
}

export interface PatientContact {
  relationship?: FHIRCodeableConcept[];
  name?: FHIRHumanName;
  telecom?: FHIRContactPoint[];
  address?: FHIRAddress;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  organization?: FHIRReference;
  period?: FHIRPeriod;
}

export interface Questionnaire extends FHIRResource {
  resourceType: 'Questionnaire';
  url?: string;
  identifier?: FHIRIdentifier[];
  version?: string;
  name?: string;
  title?: string;
  status: 'draft' | 'active' | 'retired' | 'unknown';
  subjectType?: string[];
  date?: string;
  publisher?: string;
  description?: string;
  item?: QuestionnaireItem[];
}

export interface QuestionnaireItem {
  linkId: string;
  definition?: string;
  code?: FHIRCoding[];
  prefix?: string;
  text?: string;
  type: 'group' | 'display' | 'boolean' | 'decimal' | 'integer' | 
        'date' | 'dateTime' | 'time' | 'string' | 'text' | 'url' | 
        'choice' | 'open-choice' | 'attachment' | 'reference' | 'quantity';
  required?: boolean;
  repeats?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  answerOption?: QuestionnaireAnswerOption[];
  item?: QuestionnaireItem[];
}

export interface QuestionnaireAnswerOption {
  valueInteger?: number;
  valueDate?: string;
  valueTime?: string;
  valueString?: string;
  valueCoding?: FHIRCoding;
  valueReference?: FHIRReference;
  initialSelected?: boolean;
}

export interface QuestionnaireResponse extends FHIRResource {
  resourceType: 'QuestionnaireResponse';
  identifier?: FHIRIdentifier;
  basedOn?: FHIRReference[];
  partOf?: FHIRReference[];
  questionnaire?: string;
  status: 'in-progress' | 'completed' | 'amended' | 'entered-in-error' | 'stopped';
  subject?: FHIRReference;
  encounter?: FHIRReference;
  authored?: string;
  author?: FHIRReference;
  source?: FHIRReference;
  item?: QuestionnaireResponseItem[];
}

export interface QuestionnaireResponseItem {
  linkId: string;
  definition?: string;
  text?: string;
  answer?: QuestionnaireResponseAnswer[];
  item?: QuestionnaireResponseItem[];
}

export interface QuestionnaireResponseAnswer {
  valueBoolean?: boolean;
  valueDecimal?: number;
  valueInteger?: number;
  valueDate?: string;
  valueDateTime?: string;
  valueTime?: string;
  valueString?: string;
  valueUri?: string;
  valueAttachment?: unknown;
  valueCoding?: FHIRCoding;
  valueQuantity?: unknown;
  valueReference?: FHIRReference;
  item?: QuestionnaireResponseItem[];
}

export interface Task extends FHIRResource {
  resourceType: 'Task';
  identifier?: FHIRIdentifier[];
  status: 'draft' | 'requested' | 'received' | 'accepted' | 'rejected' |
          'ready' | 'cancelled' | 'in-progress' | 'on-hold' | 'failed' |
          'completed' | 'entered-in-error';
  statusReason?: FHIRCodeableConcept;
  businessStatus?: FHIRCodeableConcept;
  intent: 'unknown' | 'proposal' | 'plan' | 'order' | 'original-order' |
          'reflex-order' | 'filler-order' | 'instance-order' | 'option';
  priority?: 'routine' | 'urgent' | 'asap' | 'stat';
  code?: FHIRCodeableConcept;
  description?: string;
  focus?: FHIRReference;
  for?: FHIRReference;
  encounter?: FHIRReference;
  executionPeriod?: FHIRPeriod;
  authoredOn?: string;
  lastModified?: string;
  requester?: FHIRReference;
  owner?: FHIRReference;
  note?: FHIRAnnotation[];
}

export interface FHIRAnnotation {
  authorReference?: FHIRReference;
  authorString?: string;
  time?: string;
  text: string;
}

export interface Communication extends FHIRResource {
  resourceType: 'Communication';
  identifier?: FHIRIdentifier[];
  status: 'preparation' | 'in-progress' | 'not-done' | 'on-hold' | 
          'stopped' | 'completed' | 'entered-in-error' | 'unknown';
  statusReason?: FHIRCodeableConcept;
  category?: FHIRCodeableConcept[];
  priority?: 'routine' | 'urgent' | 'asap' | 'stat';
  medium?: FHIRCodeableConcept[];
  subject?: FHIRReference;
  topic?: FHIRCodeableConcept;
  about?: FHIRReference[];
  sent?: string;
  received?: string;
  recipient?: FHIRReference[];
  sender?: FHIRReference;
  payload?: CommunicationPayload[];
}

export interface CommunicationPayload {
  contentString?: string;
  contentAttachment?: unknown;
  contentReference?: FHIRReference;
}

// ============================================================================
// Tenant & Researcher Types
// ============================================================================

export interface TenantConfig {
  id: string;
  name: string;
  features: string[];
  branding?: TenantBranding;
  settings?: Record<string, unknown>;
}

export interface TenantBranding {
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
}

export interface Researcher {
  id: string;
  email: string;
  name: string;
  organization?: string;
  firstAccessAt: string;
  lastAccessAt: string;
  accessCount: number;
  tenantId: string;
  purpose?: string;
  acceptedTermsAt?: string;
  marketingConsent: boolean;
}

// ============================================================================
// Agent Types
// ============================================================================

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  accountableFor: string;
  triggers: AgentTrigger[];
  tools: AgentToolReference[];
  dataAccess: DataAccessPolicy;
  workflow: WorkflowDefinition;
  requiredRoles: string[];
  maxExecutionTime: number;
}

export type AgentTrigger =
  | FHIRSubscriptionTrigger
  | ScheduleTrigger
  | ManualTrigger
  | WebhookTrigger;

export interface FHIRSubscriptionTrigger {
  type: 'fhir-subscription';
  resourceType: string;
  event: 'create' | 'update' | 'delete';
  filter?: string;
}

export interface ScheduleTrigger {
  type: 'schedule';
  cron: string;
  timezone: string;
}

export interface ManualTrigger {
  type: 'manual';
  requiredInput: Record<string, unknown>;
}

export interface WebhookTrigger {
  type: 'webhook';
  path: string;
  method: 'GET' | 'POST';
}

export interface AgentToolReference {
  name: string;
  version?: string;
  config?: Record<string, unknown>;
}

export interface DataAccessPolicy {
  fhir: {
    read: string[];
    write: string[];
    search: string[];
  };
  scope: 'patient' | 'practitioner' | 'organization' | 'tenant';
}

export interface WorkflowDefinition {
  startNodeId: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables: Record<string, { type: string; default?: unknown }>;
}

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'wait' | 'outcome';
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
  label?: string;
}

export interface AgentExecution {
  id: string;
  agentId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  currentNode?: string;
  variables: Record<string, unknown>;
  logs: AgentLogEntry[];
  outcome?: {
    status: 'success' | 'failure' | 'partial';
    message: string;
    data?: unknown;
  };
}

export interface AgentLogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  nodeId?: string;
  message: string;
  data?: unknown;
}
