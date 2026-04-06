/**
 * @mrd/sdk - MEDrecord SDK
 * 
 * Gateway client and React hooks for all MEDrecord brand apps.
 * 
 * @example
 * ```tsx
 * import { GatewayProvider, useTemplatesList, useSession } from '@mrd/sdk';
 * 
 * // In app layout
 * <GatewayProvider gatewayUrl={process.env.NEXT_PUBLIC_GATEWAY_URL!} brand="healthtalk">
 *   {children}
 * </GatewayProvider>
 * 
 * // In components
 * const { templates, isLoading } = useTemplatesList();
 * const { session, isAuthenticated } = useSession();
 * ```
 * 
 * @see mrd/.agents/specs/sdk-specification.mdx
 */

// Auth (dual-mode authentication)
export * from './auth';

// Client
export { GatewayClient, GatewayError } from './client/gateway-client';
export type {
  BrandId,
  GatewayClientOptions,
  SessionInfo,
  TemplateSearchParams,
  TemplateListResponse,
  TemplateSummary,
  TemplateDetailResponse,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  SectionListResponse,
  SectionResponse,
  CreateSectionRequest,
  UpdateSectionRequest,
  QuestionnaireDetailResponse,
  QuestionnaireResponseDetail,
  QuestionnaireSubmitRequest,
  QuestionnaireSubmitResponse,
  AppointmentSearchParams,
  AppointmentListResponse,
  AppointmentSummary,
  AppointmentDetailResponse,
  SendNotificationRequest,
} from './client/gateway-client';

// Hooks
export * from './hooks';
