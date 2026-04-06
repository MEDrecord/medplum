// Context & Provider
export { GatewayProvider, useGateway, type GatewayProviderProps } from './use-gateway';

// Auth (new dual-mode authentication)
export { 
  AuthProvider, 
  useAuth, 
  useAuthOptional,
  useUser,
  useIsAuthenticated,
  type AuthProviderProps,
} from './use-auth';

// Session (legacy - kept for backward compatibility)
export { useSession } from './use-session';

// Templates
export {
  useTemplatesList,
  useTemplateById,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  usePublishTemplate,
} from './use-templates';

// Sections
export {
  useSections,
  useCreateSection,
  useUpdateSection,
  useDeleteSection,
} from './use-sections';

// Questionnaires
export {
  useQuestionnaire,
  useSubmitQuestionnaireResponse,
  useQuestionnaireForm,
} from './use-questionnaire';

// Questionnaire Builder
export {
  useQuestionnaireBuilder,
  type UseQuestionnaireBuilderOptions,
  type UseQuestionnaireBuilderReturn,
  type ValidationError,
} from './use-questionnaire-builder';

// Score Configuration
export {
  useScoreConfiguration,
  SCORE_PRESETS,
  type UseScoreConfigurationOptions,
  type UseScoreConfigurationReturn,
  type ScoreValidationError,
  type ScorePreset,
} from './use-score-configuration';
