'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import type { 
  DeliveryChannel, 
  ChannelConfig, 
  CreateQuestionnaireTaskRequest,
  TaskPriority,
  ReminderConfig,
} from '@mrd/shared';

// ============================================
// Types
// ============================================

export interface QuestionnaireSummary {
  id: string;
  title: string;
  hasScoring: boolean;
  itemCount: number;
  estimatedMinutes?: number;
}

export interface PatientSummary {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  preferredChannel?: DeliveryChannel;
}

export interface SendQuestionnaireModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Patient to send to (pre-selected) */
  patient?: PatientSummary;
  /** Questionnaire to send (if pre-selected) */
  questionnaire?: QuestionnaireSummary;
  /** Available questionnaires to choose from */
  questionnaires?: QuestionnaireSummary[];
  /** Callback when send is initiated */
  onSend: (request: CreateQuestionnaireTaskRequest) => Promise<void>;
  /** Additional CSS class */
  className?: string;
}

// ============================================
// Channel Icons
// ============================================

function WebIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

function SmsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function VoiceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

const CHANNEL_CONFIG: Record<DeliveryChannel, { 
  label: string; 
  icon: React.FC<{ className?: string }>;
  description: string;
  requiresContact: 'phone' | 'email' | null;
  color: string;
}> = {
  web: { 
    label: 'Web link', 
    icon: WebIcon, 
    description: 'Patient opent link in browser',
    requiresContact: null,
    color: '#3B82F6',
  },
  whatsapp: { 
    label: 'WhatsApp', 
    icon: WhatsAppIcon, 
    description: 'Interactieve chat met vragenlijst',
    requiresContact: 'phone',
    color: '#25D366',
  },
  sms: { 
    label: 'SMS', 
    icon: SmsIcon, 
    description: 'Tekstbericht met link',
    requiresContact: 'phone',
    color: '#6366F1',
  },
  email: { 
    label: 'E-mail', 
    icon: EmailIcon, 
    description: 'E-mail met link naar vragenlijst',
    requiresContact: 'email',
    color: '#EC4899',
  },
  voice: { 
    label: 'Telefoon', 
    icon: VoiceIcon, 
    description: 'AI-gestuurde telefonische vragenlijst',
    requiresContact: 'phone',
    color: '#F59E0B',
  },
};

// ============================================
// Component
// ============================================

export function SendQuestionnaireModal({
  open,
  onClose,
  patient,
  questionnaire: initialQuestionnaire,
  questionnaires = [],
  onSend,
  className,
}: SendQuestionnaireModalProps) {
  // State
  const [selectedQuestionnaire, setSelectedQuestionnaire] = React.useState<QuestionnaireSummary | undefined>(initialQuestionnaire);
  const [selectedChannel, setSelectedChannel] = React.useState<DeliveryChannel>(patient?.preferredChannel ?? 'whatsapp');
  const [contactValue, setContactValue] = React.useState('');
  const [customMessage, setCustomMessage] = React.useState('');
  const [dueDate, setDueDate] = React.useState('');
  const [priority, setPriority] = React.useState<TaskPriority>('routine');
  const [enableReminders, setEnableReminders] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Update contact value when patient or channel changes
  React.useEffect(() => {
    if (!patient) return;
    
    const config = CHANNEL_CONFIG[selectedChannel];
    if (config.requiresContact === 'phone') {
      setContactValue(patient.phone ?? '');
    } else if (config.requiresContact === 'email') {
      setContactValue(patient.email ?? '');
    } else {
      setContactValue('');
    }
  }, [patient, selectedChannel]);

  // Reset state when modal opens
  React.useEffect(() => {
    if (open) {
      setSelectedQuestionnaire(initialQuestionnaire);
      setError(null);
    }
  }, [open, initialQuestionnaire]);

  // Handle send
  const handleSend = async () => {
    if (!patient || !selectedQuestionnaire) return;

    const config = CHANNEL_CONFIG[selectedChannel];
    if (config.requiresContact && !contactValue.trim()) {
      setError(`${config.requiresContact === 'phone' ? 'Telefoonnummer' : 'E-mailadres'} is vereist voor ${config.label}`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const channels: ChannelConfig[] = [{
        channel: selectedChannel,
        contactValue: contactValue.trim() || undefined,
        primary: true,
      }];

      // Add web as fallback for non-web channels
      if (selectedChannel !== 'web') {
        channels.push({
          channel: 'web',
          primary: false,
        });
      }

      const reminders: ReminderConfig | undefined = enableReminders ? {
        enabled: true,
        intervals: [24, 48, 72], // Hours
        maxReminders: 3,
        channel: selectedChannel,
      } : undefined;

      const request: CreateQuestionnaireTaskRequest = {
        patientId: patient.id,
        questionnaireId: selectedQuestionnaire.id,
        channels,
        priority,
        customMessage: customMessage.trim() || undefined,
        dueDate: dueDate || undefined,
        reminders,
      };

      await onSend(request);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  const channelConfig = CHANNEL_CONFIG[selectedChannel];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/50" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div 
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2",
          "rounded-lg border bg-background shadow-lg",
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-questionnaire-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 id="send-questionnaire-title" className="text-lg font-semibold">
            Vragenlijst versturen
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-muted"
            aria-label="Sluiten"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          {/* Patient Info */}
          {patient && (
            <div className="mb-6 rounded-lg bg-muted/50 p-4">
              <div className="text-sm text-muted-foreground">Naar</div>
              <div className="mt-1 font-medium">{patient.name}</div>
              {patient.phone && (
                <div className="text-sm text-muted-foreground">{patient.phone}</div>
              )}
              {patient.email && (
                <div className="text-sm text-muted-foreground">{patient.email}</div>
              )}
            </div>
          )}

          {/* Questionnaire Selection */}
          {!initialQuestionnaire && questionnaires.length > 0 && (
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium">Vragenlijst</label>
              <select
                value={selectedQuestionnaire?.id ?? ''}
                onChange={(e) => {
                  const q = questionnaires.find(q => q.id === e.target.value);
                  setSelectedQuestionnaire(q);
                }}
                className="w-full rounded-md border bg-background px-3 py-2"
              >
                <option value="">Selecteer een vragenlijst...</option>
                {questionnaires.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title} {q.hasScoring && '(met score)'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Selected Questionnaire Info */}
          {selectedQuestionnaire && (
            <div className="mb-6 rounded-lg border p-4">
              <div className="font-medium">{selectedQuestionnaire.title}</div>
              <div className="mt-1 flex gap-3 text-sm text-muted-foreground">
                <span>{selectedQuestionnaire.itemCount} vragen</span>
                {selectedQuestionnaire.estimatedMinutes && (
                  <span>~{selectedQuestionnaire.estimatedMinutes} min</span>
                )}
                {selectedQuestionnaire.hasScoring && (
                  <span className="text-primary">Met score</span>
                )}
              </div>
            </div>
          )}

          {/* Channel Selection */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">Verstuur via</label>
            <div className="grid grid-cols-5 gap-2">
              {(Object.entries(CHANNEL_CONFIG) as [DeliveryChannel, typeof CHANNEL_CONFIG[DeliveryChannel]][]).map(([channel, config]) => {
                const Icon = config.icon;
                const isSelected = selectedChannel === channel;
                return (
                  <button
                    key={channel}
                    type="button"
                    onClick={() => setSelectedChannel(channel)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border p-3 transition-colors",
                      isSelected 
                        ? "border-primary bg-primary/5" 
                        : "hover:bg-muted"
                    )}
                    title={config.description}
                  >
                    <Icon 
                      className={cn(
                        "h-5 w-5",
                        isSelected && "text-primary"
                      )} 
                    />
                    <span className="text-xs">{config.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {channelConfig.description}
            </p>
          </div>

          {/* Contact Value (if required) */}
          {channelConfig.requiresContact && (
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium">
                {channelConfig.requiresContact === 'phone' ? 'Telefoonnummer' : 'E-mailadres'}
              </label>
              <input
                type={channelConfig.requiresContact === 'email' ? 'email' : 'tel'}
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                placeholder={channelConfig.requiresContact === 'phone' ? '+31 6 12345678' : 'patient@example.com'}
                className="w-full rounded-md border bg-background px-3 py-2"
              />
            </div>
          )}

          {/* Custom Message */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">
              Persoonlijk bericht <span className="text-muted-foreground">(optioneel)</span>
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Voeg een persoonlijk bericht toe..."
              rows={3}
              className="w-full resize-none rounded-md border bg-background px-3 py-2"
            />
          </div>

          {/* Due Date */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">
              Deadline <span className="text-muted-foreground">(optioneel)</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full rounded-md border bg-background px-3 py-2"
            />
          </div>

          {/* Priority */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">Prioriteit</label>
            <div className="flex gap-2">
              {(['routine', 'urgent'] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    "rounded-md border px-4 py-2 text-sm transition-colors",
                    priority === p
                      ? p === 'urgent' 
                        ? "border-destructive bg-destructive/10 text-destructive"
                        : "border-primary bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  )}
                >
                  {p === 'routine' ? 'Normaal' : 'Urgent'}
                </button>
              ))}
            </div>
          </div>

          {/* Reminders */}
          <div className="mb-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={enableReminders}
                onChange={(e) => setEnableReminders(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium">Automatische herinneringen</span>
            </label>
            {enableReminders && (
              <p className="mt-1 text-xs text-muted-foreground">
                Herinneringen na 24, 48 en 72 uur als niet ingevuld
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
            disabled={isLoading}
          >
            Annuleren
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading || !patient || !selectedQuestionnaire}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white",
              "bg-primary hover:bg-primary/90",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Versturen...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m22 2-7 20-4-9-9-4 20-7z" />
                  <path d="m22 2-11 11" />
                </svg>
                Versturen
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

export default SendQuestionnaireModal;
